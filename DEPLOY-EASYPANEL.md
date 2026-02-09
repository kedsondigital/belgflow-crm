# Deploy BelgiFlow CRM no Easypanel

Guia passo a passo para publicar o BelgiFlow CRM no seu servidor com Easypanel.

## Pré-requisitos

- **Easypanel** instalado no seu servidor (Linux, 2GB RAM recomendado)
- **Repositório Git** com o código (GitHub, GitLab, etc.)
- **Supabase** configurado (URL, anon key, service role key)
- **Domínio** (opcional – Easypanel gera URL automática)

---

## Passo 1: Criar o projeto no Easypanel

1. Acesse o painel do Easypanel
2. Clique em **"New"**
3. Nome do projeto: **belgiflow-crm**
4. Clique em **"Create"**

---

## Passo 2: Criar o serviço App

1. No projeto, clique em **"+ Service"**
2. Escolha **"App"**
3. Nome sugerido: **crm**

---

## Passo 3: Configurar o repositório Git

1. Na aba **"Source"**:
   - **Build Method**: Dockerfile
   - **Repository**: URL do seu repositório (ex: `https://github.com/seu-usuario/belgflow-crm`)
   - **Branch**: `main` (ou a branch que usa)
   - **Dockerfile path**: `Dockerfile` (na raiz do projeto)

2. Se o repositório for privado, configure credenciais (token/deploy key)

---

## Passo 4: Variáveis de ambiente no Easypanel

⚠️ **IMPORTANTE:** Configure as variáveis **antes** do deploy (são usadas durante o build).

### Como preencher na aba "Environment"

1. No Easypanel, abra seu App **crm** e vá na aba **"Environment"** (ou **"Variáveis de ambiente"**).
2. Clique em **"Adicionar"** ou no **+** para cada variável.
3. Preencha **Nome** e **Valor** conforme a tabela abaixo.

### Variáveis (copie do seu .env.local)

Use os mesmos nomes e valores do seu `.env.local`. A única que você deve alterar é `NEXT_PUBLIC_SITE_URL`:

| Nome (chave) | De onde pegar o valor | Exemplo |
|--------------|------------------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Copie do `.env.local` | `https://belgiflow-supabase.xxx.easypanel.host` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copie do `.env.local` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copie do `.env.local` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `NEXT_PUBLIC_SITE_URL` | **Altere:** use a URL do app no Easypanel | `https://crm.seudominio.com` ou `https://belgiflow-xxx.easypanel.host` |
| `N8N_INGEST_TOKEN` | Copie do `.env.local` (se usar n8n) | `seu-token-secreto` |
| `N8N_DEDUPE_FIELD` | Opcional | `email` |

### Onde achar cada valor no .env.local

Abra o arquivo `belgflow-crm/.env.local` no seu projeto e copie o valor que está **depois do `=`** em cada linha:

```
NEXT_PUBLIC_SUPABASE_URL=          → copie o que vem após o =
NEXT_PUBLIC_SUPABASE_ANON_KEY=     → copie o que vem após o =
SUPABASE_SERVICE_ROLE_KEY=         → copie o que vem após o =
NEXT_PUBLIC_SITE_URL=              → troque localhost pela URL real do Easypanel
```

### Exemplo de preenchimento no Easypanel

Para cada linha, adicione uma variável:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://belgiflow-supabase.bnw7is.easypanel.host` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(valor longo que começa com eyJ...)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(valor longo que começa com eyJ...)* |
| `NEXT_PUBLIC_SITE_URL` | URL do app (ex: `https://crm.belgiflow.easypanel.host`). Se ainda não tiver domínio, use um provisório como `https://crm.seuservidor.com` e atualize depois em **Domains**. |

### Ordem correta

1. Adicione **todas** as variáveis na aba Environment.
2. Clique em **Salvar**.
3. Só depois clique em **Deploy**.

---

## Passo 5: Configurar Supabase Auth

1. No **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Em **Site URL**, use: `https://sua-url-do-easypanel.com`
3. Em **Redirect URLs**, adicione:
   - `https://sua-url-do-easypanel.com/auth/callback`
   - `https://sua-url-do-easypanel.com/**`

Salve as alterações.

---

## Passo 6: Porta e domínio

1. Aba **"Domains"** (ou "Network"):
   - Ative **HTTPS** (Let’s Encrypt)
   - Defina o domínio (ex: `crm.seudominio.com`) ou use o domínio padrão do Easypanel

2. **Porta**: 3000 (padrão do Next.js)

---

## Passo 7: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e o start do container
3. Verifique os logs na aba **"Logs"** em caso de erro

---

## Checklist antes do deploy

- [ ] Código no repositório Git
- [ ] Dockerfile na raiz do projeto
- [ ] Variáveis de ambiente configuradas
- [ ] `NEXT_PUBLIC_SITE_URL` igual à URL real do app
- [ ] Supabase: Site URL e Redirect URLs atualizados
- [ ] Migrations do Supabase aplicadas (`supabase db push` ou SQL Editor)

---

## Troubleshooting

### Erro de autenticação (redirect)
- Confirme `NEXT_PUBLIC_SITE_URL`
- Verifique Redirect URLs no Supabase

### App não inicia
- Veja os logs no Easypanel
- Confirme que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos

### Build falha com "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios"
- As variáveis de ambiente precisam estar na aba **Environment** antes do deploy
- **Salve** as variáveis e só depois clique em **Deploy**
- Se o Easypanel tiver aba **"Build"** ou **"Build Arguments"**, adicione lá:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Outros erros de build
- Verifique se o Dockerfile está na raiz
- Confirme que `npm run build` roda localmente sem erro

---

## Push to Deploy (opcional)

Para deploys automáticos a cada push:

1. Easypanel → seu App → **Settings**
2. Configure **Webhook** ou integração com GitHub/GitLab
3. Cada push na branch configurada dispara um novo deploy
