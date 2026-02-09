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

## Passo 4: Variáveis de ambiente

Na aba **"Environment"**, adicione:

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase (ex: `https://xxx.supabase.co`) | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role do Supabase | Sim |
| `NEXT_PUBLIC_SITE_URL` | URL do app (ex: `https://crm.seudominio.com`) | Sim |
| `N8N_INGEST_TOKEN` | Token da API n8n (se usar) | Não |
| `N8N_DEDUPE_FIELD` | Campo dedupe: `email` \| `phone` \| `website` \| `none` | Não |

**Importante:** `NEXT_PUBLIC_SITE_URL` deve ser a URL final do app no Easypanel.  
Exemplo: `https://crm.belgiflow.com` ou `https://belgiflow-xxx.easypanel.host`.

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

### Build falha
- Verifique se o Dockerfile está na raiz
- Confirme que `npm run build` roda localmente sem erro

---

## Push to Deploy (opcional)

Para deploys automáticos a cada push:

1. Easypanel → seu App → **Settings**
2. Configure **Webhook** ou integração com GitHub/GitLab
3. Cada push na branch configurada dispara um novo deploy
