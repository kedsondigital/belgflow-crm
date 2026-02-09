-- Corrige recursão infinita na policy de pipeline_members
-- O problema: "Pipeline admin can manage members" fazia SELECT em pipeline_members
-- dentro da própria checagem, causando loop

-- 1. Criar função helper que bypassa RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_pipeline_admin(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM pipeline_members 
    WHERE pipeline_id = p_id AND user_id = u_id AND role_in_pipeline = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Remover a policy problemática
DROP POLICY IF EXISTS "Pipeline admin can manage members" ON pipeline_members;

-- 3. Criar policies separadas para UPDATE e DELETE (sem recursão)
CREATE POLICY "Pipeline admin can update members" ON pipeline_members
  FOR UPDATE USING (is_pipeline_admin(pipeline_id, auth.uid()));

CREATE POLICY "Pipeline admin can delete members" ON pipeline_members
  FOR DELETE USING (is_pipeline_admin(pipeline_id, auth.uid()));

-- 4. Policy para INSERT: admin pode adicionar outros membros
--    (Creator can add self já cobre quando o usuário se adiciona)
CREATE POLICY "Pipeline admin can insert members" ON pipeline_members
  FOR INSERT WITH CHECK (is_pipeline_admin(pipeline_id, auth.uid()));
