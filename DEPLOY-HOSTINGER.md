# Deploy BelgiFlow CRM na Hostinger

Guia para fazer deploy do BelgiFlow usando **build local + upload** (sem build na Hostinger).

## Requisitos

- Node.js 18+
- Conta Hostinger com plano Business ou Cloud (Node.js disponível)
- Variáveis do Supabase configuradas

---

## Passo a passo

### 1. Gerar o pacote de deploy

Na pasta do projeto, rode:

```bash
npm run deploy:hostinger
```

Isso vai:

- Rodar `npm run build`
- Montar o pacote standalone (`.next/standalone` + static + public)
- Gerar o arquivo **`belgflow-crm-hostinger.zip`**

### 2. Variáveis de ambiente

Antes do upload, tenha em mãos os valores:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role do Supabase |
| `NEXT_PUBLIC_SITE_URL` | URL pública do app (ex: `https://seudominio.com`) |
| `N8N_INGEST_TOKEN` | Token da API n8n (opcional) |

Essas variáveis **não** entram no ZIP. Configure-as no painel da Hostinger.

### 3. Upload na Hostinger

1. Acesse o **hPanel** da Hostinger
2. Vá em **Node.js** (ou Aplicações → Node.js)
3. Clique em **Upload**
4. Envie o arquivo **`belgflow-crm-hostinger.zip`**
5. Aguarde a extração

### 4. Configurar variáveis no painel

No painel da aplicação Node.js:

1. Abra a seção de **Variáveis de ambiente**
2. Adicione cada variável da tabela acima
3. Salve

### 5. Comando de start

Configure o comando de inicialização:

```bash
node server.js
```

Ou, se a Hostinger usar `npm start`, o `package.json` do pacote já define `"start": "node server.js"`, então `npm start` funciona automaticamente.

### 6. Porta

O Next.js standalone usa a variável `PORT`; se a Hostinger fornecer porta via ambiente, o app usará essa porta automaticamente.

---

## Resumo do fluxo

```
npm run deploy:hostinger
    → belgflow-crm-hostinger.zip
    → Upload no hPanel
    → Configurar variáveis
    → Iniciar com: node server.js
```

---

## Observações

- O build é feito na sua máquina, com as variáveis do `.env.local` ou `.env.production.local`
- Para produção, use `.env.production.local` com URLs e chaves corretas **antes** de rodar `npm run deploy:hostinger`
- **Não** inclua arquivos `.env` no ZIP; use as variáveis do painel da Hostinger
- Se precisar testar o pacote localmente:
  ```bash
  unzip belgflow-crm-hostinger.zip -d test-deploy
  cd test-deploy
  node server.js
  ```
