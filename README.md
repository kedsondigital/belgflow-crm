# BelgiFlow CRM

CRM web focado em pipelines (Kanban) para organizar leads coletados por scraping via n8n.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + shadcn/ui + Tailwind
- **Backend/DB/Auth:** Supabase (Postgres + RLS + Supabase Auth)
- **Integração:** API de ingestão para n8n

## Pré-requisitos

- Node.js 18+
- Conta Supabase
- n8n (para automação de leads)

## Configuração

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (público) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (NUNCA expor no client) |
| `N8N_INGEST_TOKEN` | Token secreto para o endpoint de ingestão n8n |
| `N8N_DEDUPE_FIELD` | Campo para deduplicação: `email`, `phone`, `website` ou `none` |
| `NEXT_PUBLIC_SITE_URL` | URL base do app (ex: `http://localhost:3000`) |

### 2. Migrations no Supabase

Execute os arquivos SQL em `supabase/migrations/` no SQL Editor do Supabase, na ordem:

1. `001_initial_schema.sql` – tabelas, triggers, índices
2. `002_rls_policies.sql` – políticas de Row Level Security
3. `003_fix_pipeline_creator_policy.sql` – criador pode se adicionar ao pipeline
4. `004_fix_pipeline_members_recursion.sql` – correção de recursão em policies
5. `005_leads_new_fields.sql` – campos resumo, nacionalidade, valor, phone_country_code em leads

**Se aparecer erro "nacionalidade" ou "schema cache" ao criar/editar leads**, execute no SQL Editor:

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS resumo TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nacionalidade TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor DECIMAL(15,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '55';
```

Ou use o Supabase CLI:

```bash
supabase db push
```

### 3. Criar usuário ADMIN inicial

1. Crie um usuário pelo Supabase Dashboard (Authentication → Users → Add user)
2. No SQL Editor, execute:

```sql
UPDATE profiles
SET role_global = 'ADMIN'
WHERE email = 'seu-email@exemplo.com';
```

Substitua `seu-email@exemplo.com` pelo email do usuário admin.

### 4. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Rotas

| Rota | Descrição |
|------|-----------|
| `/login` | Login e recuperação de senha |
| `/pipelines` | Lista de pipelines |
| `/pipelines/new` | Criar pipeline |
| `/pipelines/[id]` | Kanban do pipeline |
| `/leads` | Lista de leads (tabela) |
| `/tasks` | Minhas tarefas |
| `/admin/users` | Gerenciar usuários (ADMIN) |
| `/settings` | Configurações do perfil |

## API de ingestão (n8n)

### Endpoint

`POST /api/n8n/ingest-lead`

### Autenticação

Envie o token no header:

```
Authorization: Bearer SEU_N8N_INGEST_TOKEN
```

ou:

```
X-API-Key: SEU_N8N_INGEST_TOKEN
```

### Corpo (JSON)

```json
{
  "pipeline_id": "uuid-do-pipeline",
  "title": "Nome ou Empresa",
  "email": "lead@exemplo.com",
  "phone": "+5511999999999",
  "whatsapp": "+5511999999999",
  "website": "https://exemplo.com",
  "source": "scrapping n8n",
  "tags": ["tag1", "tag2"]
}
```

- `pipeline_id` (obrigatório): UUID do pipeline de destino
- `title` (obrigatório): Nome/empresa do lead
- `email`, `phone`, `whatsapp`, `website` (opcionais)
- `source` (opcional): origem do lead (default: "scrapping n8n")
- `tags` (opcional): array de strings

O lead é inserido no primeiro estágio do pipeline ("Entrada" por padrão).

### Testar com curl

```bash
curl -X POST http://localhost:3000/api/n8n/ingest-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_N8N_INGEST_TOKEN" \
  -d '{
    "pipeline_id": "UUID-DO-PIPELINE",
    "title": "Lead de Teste",
    "email": "teste@exemplo.com",
    "source": "scrapping n8n"
  }'
```

### Deduplicação

Configure `N8N_DEDUPE_FIELD`:

- `email` – evita leads duplicados por email
- `phone` – por telefone
- `website` – por site
- `none` – sem deduplicação

## Papéis e permissões

- **ADMIN:** acesso total (pipelines, leads, usuários, configurações)
- **MEMBER:** acesso apenas a pipelines em que é membro

O acesso a pipelines é controlado em Admin → Usuários → Acesso.

## Estrutura do projeto

```
src/
├── app/
│   ├── (dashboard)/        # Rotas privadas com layout
│   │   ├── pipelines/
│   │   ├── leads/
│   │   ├── tasks/
│   │   ├── admin/users/
│   │   └── settings/
│   ├── api/n8n/ingest-lead/
│   ├── auth/
│   └── login/
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── kanban-board.tsx
│   ├── lead-card.tsx
│   ├── lead-drawer.tsx
│   └── ...
├── lib/
│   └── supabase/
└── types/
```

## Licença

MIT
