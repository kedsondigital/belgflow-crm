-- Permite que o criador do pipeline se adicione como membro admin
-- (necessário porque ao criar não há membros ainda, então a policy "Pipeline admin can manage" falha)
CREATE POLICY "Creator can add self to pipeline_members" ON pipeline_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM pipelines
      WHERE id = pipeline_id AND created_by = auth.uid()
    )
  );
