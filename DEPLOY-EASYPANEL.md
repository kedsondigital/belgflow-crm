# Deploy BelgiFlow CRM no Easypanel — Guia Completo

Guia passo a passo detalhado para publicar o BelgiFlow CRM do zero no Easypanel.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Supabase (banco e auth)](#2-supabase-banco-e-auth)
3. [Repositório Git](#3-repositório-git)
4. [Instalar Easypanel](#4-instalar-easypanel)
5. [Criar projeto e App](#5-criar-projeto-e-app)
6. [Configurar repositório](#6-configurar-repositório)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Domínio e rede](#8-domínio-e-rede)
9. [Deploy](#9-deploy)
10. [Configurar Supabase Auth](#10-configurar-supabase-auth)
11. [Verificar e testar](#11-verificar-e-testar)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pré-requisitos

Antes de começar, você precisa ter:

| Item | Descrição |
|------|-----------|
| **Servidor** | VPS ou servidor Linux (2GB RAM, 1 vCPU recomendado) |
| **Domínio** | Opcional — Easypanel gera URL automática |
| **Conta Supabase** | [supabase.com](https://supabase.com) |
| **Conta GitHub/GitLab** | Repositório com o código do BelgiFlow |
| **SSH** | Acesso SSH ao servidor para instalar o Easypanel |

---

## 2. Supabase (banco e auth)

### 2.1. Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `belgiflow` (ou outro nome)
   - **Database Password**: guarde em local seguro
   - **Region**: escolha a mais próxima
4. Clique em **"Create new project"** e aguarde a criação

### 2.2. Aplicar migrations

1. No painel do Supabase, vá em **SQL Editor**
2. Crie uma nova query e execute **cada arquivo** em `supabase/migrations/` nesta ordem:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_fix_pipeline_creator_policy.sql`
   - `004_fix_pipeline_members_recursion.sql`
   - `005_leads_new_fields.sql`
   - `006_members_read_copipeline_profiles.sql`
3. Confirme que todas executaram sem erro

### 2.3. Anotar credenciais

1. Vá em **Project Settings** (ícone de engrenagem)
2. Em **API**, anote:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → será `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)

---

## 3. Repositório Git

### 3.1. Garantir que o código está no GitHub/GitLab

1. Certifique-se de que o projeto está versionado:
   ```bash
   git status
   git add .
   git commit -m "Deploy Easypanel"
   git push origin main
   ```
2. Anote a URL do repositório (ex: `https://github.com/seu-usuario/belgflow-crm`)

### 3.2. Repositório privado

Se for privado, crie um **Personal Access Token** ou **Deploy Key** no GitHub/GitLab. Você vai precisar na configuração do Easypanel.

---

## 4. Instalar Easypanel

### 4.1. Conectar ao servidor

```bash
ssh seu-usuario@ip-do-servidor
```

### 4.2. Instalar Easypanel

Execute no servidor:

```bash
curl -sSL https://get.easypanel.io | sh
```

Siga as instruções na tela (criação de usuário, senha, porta).

### 4.3. Acessar o painel

1. Abra no navegador: `http://IP-DO-SERVIDOR:3000` (ou a porta indicada)
2. Faça login com o usuário e senha criados

---

## 5. Criar projeto e App

### 5.1. Criar o projeto

1. No Easypanel, clique em **"New"** (ou **"Create Project"**)
2. **Project name**: `belgiflow` (ou o que preferir)
3. Clique em **"Create"**

### 5.2. Criar o serviço App

1. Dentro do projeto, clique em **"+ Service"** ou **"Add"**
2. Selecione **"App"** (aplicação containerizada)
3. **Name**: `crm`
4. Confirme a criação

---

## 6. Configurar repositório

### 6.1. Aba Source

1. Com o App **crm** aberto, vá na aba **"Source"**
2. **Build Method**: escolha **Dockerfile**
3. **Repository URL**: cole a URL do repositório  
   - Exemplo: `https://github.com/kedsondigital/belgflow-crm`
4. **Branch**: `main` (ou sua branch principal)
5. **Dockerfile path**: `Dockerfile` (deixe em branco se estiver na raiz)

### 6.2. Repositório privado

Se for privado:

- **Username**: seu usuário do GitHub
- **Password/Token**: Personal Access Token (não use a senha da conta)
- Ou use **Deploy Key** se configurado

---

## 7. Variáveis de ambiente

Esta etapa é crítica. As variáveis precisam estar definidas **antes** do deploy.

### 7.1. Abrir a aba Environment

1. No App **crm**, vá na aba **"Environment"** (ou **"Variables"**)
2. Você verá uma lista de variáveis e um botão para adicionar

### 7.2. Variáveis obrigatórias

Adicione **uma por uma**:

| Nome (Key) | Valor | Onde pegar |
|------------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_SITE_URL` | URL final do app | **Ainda não tem?** Use `https://crm.seudominio.com` ou veja passo 8 |

### 7.3. Variáveis opcionais (n8n)

| Nome (Key) | Valor |
|------------|-------|
| `N8N_INGEST_TOKEN` | Token secreto para API de ingestão |
| `N8N_DEDUPE_FIELD` | `email` ou `phone` ou `website` ou `none` |

### 7.4. Exemplo de preenchimento

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL = https://crm.seudominio.com
```

### 7.5. Importante sobre NEXT_PUBLIC_SITE_URL

- Deve ser a URL em que o usuário acessa o CRM
- Se ainda não configurou domínio, use provisoriamente a URL do Easypanel (ex: `https://crm.belgiflow.seudominio.easypanel.host`)
- Você pode ajustar depois em **Domains**

### 7.6. Sobre o build (não precisa de Build Arguments)

O BelgiFlow foi ajustado para **não precisar** de variáveis durante o build. As variáveis são injetadas em **runtime** quando o container inicia. Basta configurar na aba **Environment** — não é necessário configurar Build Arguments.

### 7.7. Salvar

Depois de adicionar todas, clique em **"Save"** ou **"Apply"**.

---

## 8. Domínio e rede

### 8.1. Aba Domains (ou Network)

1. Vá na aba **"Domains"** do App **crm**
2. Se quiser domínio próprio:
   - Adicione o domínio (ex: `crm.seudominio.com`)
   - Aponte o DNS do domínio para o IP do servidor (registro A ou CNAME)
   - Ative **HTTPS** (Let's Encrypt) se disponível
3. Se não tiver domínio:
   - O Easypanel geralmente fornece uma URL automática (ex: `crm-nome.easypanel.host`)
   - Use essa URL como `NEXT_PUBLIC_SITE_URL` e atualize na aba Environment se necessário

### 8.2. Porta

- O Next.js usa a porta **3000** por padrão
- O Easypanel costuma mapear automaticamente
- Se houver campo **Port**, use `3000`

---

## 9. Deploy

### 9.1. Executar o deploy

1. Certifique-se de que salvou as variáveis de ambiente
2. Clique em **"Deploy"** (ou **"Build & Deploy"**)
3. O Easypanel irá:
   - Clonar o repositório
   - Executar o build do Docker (Dockerfile)
   - Subir o container

### 9.2. Acompanhar o build

1. Abra a aba **"Logs"** ou **"Build logs"**
2. Aguarde até aparecer algo como:
   - `Build completed`
   - `Container started`
   - `Listening on port 3000`

### 9.3. Tempo estimado

O primeiro build pode levar **3 a 8 minutos** dependendo do servidor.

---

## 10. Configurar Supabase Auth

O Supabase precisa saber quais URLs pode usar para redirecionamento.

### 10.1. No Supabase Dashboard

1. Vá em **Authentication** → **URL Configuration**
2. **Site URL**: use a URL do seu app  
   - Ex: `https://crm.seudominio.com`
3. **Redirect URLs**: adicione (uma por linha):
   ```
   https://crm.seudominio.com/auth/callback
   https://crm.seudominio.com/**
   ```
4. Clique em **Save**

---

## 11. Verificar e testar

### 11.1. Acessar o app

1. Abra a URL configurada no navegador
2. Você deve ver a tela de login do BelgiFlow

### 11.2. Criar o primeiro usuário

1. Se o Supabase Auth estiver com sign-up liberado, crie uma conta
2. Ou adicione um usuário manualmente no Supabase: **Authentication** → **Users** → **Add user**

### 11.3. Testar fluxo

- Login
- Criar pipeline
- Adicionar lead
- Mover lead no Kanban

---

## 12. Troubleshooting

### Erro: "NEXT_PUBLIC_SUPABASE_URL is required"

- As variáveis `NEXT_PUBLIC_*` precisam estar na aba **Environment** **antes** do deploy
- Salve as variáveis e faça um novo deploy
- Alguns painéis têm aba **"Build arguments"** — verifique se essas variáveis também precisam estar lá

### Erro de redirect / loop de login

1. Confirme que `NEXT_PUBLIC_SITE_URL` é exatamente a URL que você usa para acessar
2. Verifique **Redirect URLs** no Supabase (incluindo `**` no final)

### Build falha no Docker

1. Veja os logs completos na aba **Logs**
2. Rode localmente: `docker build -t belgflow-test .` na pasta do projeto
3. Confirme que o `Dockerfile` está na raiz e que o repositório tem o código correto

### App não inicia / 502 Bad Gateway

1. Confira os logs do container
2. Verifique se a porta 3000 está exposta
3. Teste localmente: `npm run build && npm run start`

### Erro de permissão no banco (RLS)

- Certifique-se de que rodou **todas** as migrations
- Verifique as políticas RLS no Supabase (Table Editor → cada tabela → RLS)

---

## Checklist final

- [ ] Projeto Supabase criado
- [ ] Migrations aplicadas
- [ ] Código no repositório Git
- [ ] Easypanel instalado no servidor
- [ ] Projeto e App criados no Easypanel
- [ ] Repositório configurado (Source)
- [ ] Todas as variáveis de ambiente adicionadas e salvas
- [ ] Domínio configurado (ou URL do Easypanel anotada)
- [ ] Deploy executado com sucesso
- [ ] Supabase Auth: Site URL e Redirect URLs atualizados
- [ ] App acessível e login funcionando

---

## Push to Deploy (opcional)

Para deploys automáticos a cada `git push`:

1. Easypanel → App **crm** → **Settings**
2. Procure por **Webhook** ou **Git integration**
3. Configure o webhook (GitHub/GitLab enviam POST no push)
4. Cada push na branch configurada dispara um novo build e deploy
