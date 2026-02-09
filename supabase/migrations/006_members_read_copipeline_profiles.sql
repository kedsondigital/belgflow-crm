-- MEMBER users can read profiles of users who share a pipeline with them.
-- This allows the assignee field and member names to display correctly for MEMBER role.
CREATE POLICY "Members can read co-pipeline member profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pipeline_members pm1
      INNER JOIN pipeline_members pm2 ON pm1.pipeline_id = pm2.pipeline_id AND pm2.user_id = auth.uid()
      WHERE pm1.user_id = profiles.id
    )
  );
