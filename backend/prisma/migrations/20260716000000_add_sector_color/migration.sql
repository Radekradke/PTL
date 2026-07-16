-- Cor de identificação visual do setor (escolhida no cadastro)
ALTER TABLE "Sector" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#00A859';
