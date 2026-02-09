-- Belgflow CRM - Row Level Security Policies
-- ADMIN: full access. MEMBER: only pipelines where they are members.

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is ADMIN
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role_global = 'ADMIN' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is pipeline member
CREATE OR REPLACE FUNCTION public.is_pipeline_member(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM pipeline_members WHERE pipeline_id = p_id AND user_id = u_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get pipeline_id from stage_id
CREATE OR REPLACE FUNCTION public.get_lead_pipeline_id(lead_id UUID)
RETURNS UUID AS $$
  SELECT pipeline_id FROM leads WHERE id = lead_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- Admin can update all profiles (role, is_active)
CREATE POLICY "Admin can update profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));

-- Users can update own profile (name, avatar)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PIPELINES
-- Admin: full access
CREATE POLICY "Admin full access pipelines" ON pipelines
  FOR ALL USING (is_admin(auth.uid()));

-- Member: can see pipelines where they are members
CREATE POLICY "Members can view pipeline" ON pipelines
  FOR SELECT USING (is_pipeline_member(id, auth.uid()));

-- Member: can insert if they have access (via trigger or app logic - member creating pipeline gets auto-added)
CREATE POLICY "Members can create pipeline" ON pipelines
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Member: can update pipelines they are admin of
CREATE POLICY "Pipeline admin can update" ON pipelines
  FOR UPDATE USING (
    is_pipeline_member(id, auth.uid()) AND
    EXISTS (SELECT 1 FROM pipeline_members pm WHERE pm.pipeline_id = pipelines.id AND pm.user_id = auth.uid() AND pm.role_in_pipeline = 'admin')
  );

-- Member: can delete pipelines they are admin of
CREATE POLICY "Pipeline admin can delete" ON pipelines
  FOR DELETE USING (
    is_pipeline_member(id, auth.uid()) AND
    EXISTS (SELECT 1 FROM pipeline_members pm WHERE pm.pipeline_id = pipelines.id AND pm.user_id = auth.uid() AND pm.role_in_pipeline = 'admin')
  );

-- PIPELINE_MEMBERS
-- Admin: full access
CREATE POLICY "Admin full access pipeline_members" ON pipeline_members
  FOR ALL USING (is_admin(auth.uid()));

-- Members can view pipeline members of their pipelines
CREATE POLICY "Members can view pipeline_members" ON pipeline_members
  FOR SELECT USING (is_pipeline_member(pipeline_id, auth.uid()));

-- Pipeline admin can manage members
CREATE POLICY "Pipeline admin can manage members" ON pipeline_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pipeline_members pm WHERE pm.pipeline_id = pipeline_members.pipeline_id AND pm.user_id = auth.uid() AND pm.role_in_pipeline = 'admin')
  );

-- STAGES
-- Admin: full access
CREATE POLICY "Admin full access stages" ON stages
  FOR ALL USING (is_admin(auth.uid()));

-- Member: access via pipeline
CREATE POLICY "Members can view stages" ON stages
  FOR SELECT USING (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can insert stages" ON stages
  FOR INSERT WITH CHECK (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can update stages" ON stages
  FOR UPDATE USING (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can delete stages" ON stages
  FOR DELETE USING (is_pipeline_member(pipeline_id, auth.uid()));

-- LEADS
-- Admin: full access
CREATE POLICY "Admin full access leads" ON leads
  FOR ALL USING (is_admin(auth.uid()));

-- Member: access via pipeline
CREATE POLICY "Members can view leads" ON leads
  FOR SELECT USING (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can insert leads" ON leads
  FOR INSERT WITH CHECK (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can update leads" ON leads
  FOR UPDATE USING (is_pipeline_member(pipeline_id, auth.uid()));

CREATE POLICY "Members can delete leads" ON leads
  FOR DELETE USING (is_pipeline_member(pipeline_id, auth.uid()));

-- LEAD_TAGS
CREATE POLICY "Admin full access lead_tags" ON lead_tags
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Members can view lead_tags" ON lead_tags
  FOR SELECT USING (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can insert lead_tags" ON lead_tags
  FOR INSERT WITH CHECK (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can update lead_tags" ON lead_tags
  FOR UPDATE USING (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can delete lead_tags" ON lead_tags
  FOR DELETE USING (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

-- LEAD_ACTIVITIES
CREATE POLICY "Admin full access lead_activities" ON lead_activities
  FOR ALL USING (
    is_admin(auth.uid()) OR
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can view lead_activities" ON lead_activities
  FOR SELECT USING (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can insert lead_activities" ON lead_activities
  FOR INSERT WITH CHECK (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

-- TASKS
CREATE POLICY "Admin full access tasks" ON tasks
  FOR ALL USING (
    is_admin(auth.uid()) OR
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );

CREATE POLICY "Members can manage tasks" ON tasks
  FOR ALL USING (
    is_pipeline_member((SELECT pipeline_id FROM leads WHERE id = lead_id), auth.uid())
  );
