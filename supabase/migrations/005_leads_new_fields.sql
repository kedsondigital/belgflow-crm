-- Novos campos nos leads: resumo, nacionalidade, valor
ALTER TABLE leads ADD COLUMN IF NOT EXISTS resumo TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nacionalidade TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor DECIMAL(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '32';
