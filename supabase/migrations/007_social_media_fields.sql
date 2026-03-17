-- Adiciona campos de redes sociais e dados do proprietário na tabela leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS linkedin   TEXT,
  ADD COLUMN IF NOT EXISTS facebook   TEXT,
  ADD COLUMN IF NOT EXISTS instagram  TEXT,
  ADD COLUMN IF NOT EXISTS nome_dono  TEXT,
  ADD COLUMN IF NOT EXISTS email_dono TEXT;
