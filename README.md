# RSIM Consultoria — Portal do Corretor

Wrapper React (Vite + TypeScript + Tailwind + shadcn/ui) que serve o site legado da RSIM Consultoria via iframe em tela cheia, com autenticação centralizada via Supabase (Lovable Cloud) e um sistema de solicitações para os setores Pós Vendas, Movimentação e Implantação.

## Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- **Backend:** Supabase (Auth, Postgres com RLS, Edge Functions Deno)
- **Integrações:** Bitrix24 (via edge function `submit-bitrix`), Google OAuth
- **Site legado:** `public/rsim.html` (HTML/JS monolítico embarcado por iframe)

## Estrutura

```
.
├── public/
│   └── rsim.html              # Site legado RSIM (modais, formulários, checklists por operadora)
├── src/
│   ├── pages/                 # Index, Solicitar, Acompanhar, Admin, NotFound
│   ├── components/ui/         # Componentes shadcn/ui
│   ├── integrations/supabase/ # Client e tipos (auto-gerados)
│   └── index.css              # Design tokens HSL
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── lookup-solicitations/  # Consulta de solicitações por e-mail (rate-limited)
│   │   └── submit-bitrix/         # Cria deals + tasks no Bitrix24
│   └── migrations/                # Schema: profiles, sectors, solicitations, user_roles, has_role()
└── vite.config.ts
```

## Setup local

```bash
# 1. Instalar dependências
bun install   # ou npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com as credenciais do seu projeto Supabase

# 3. Rodar em desenvolvimento
bun run dev   # http://localhost:8080

# 4. Build de produção
bun run build
bun run preview
```

## Banco de dados

As migrations em `supabase/migrations/` criam:

- `profiles` — perfil do usuário (auto-populado via trigger `handle_new_user`)
- `sectors` — Pós Vendas, Movimentação, Implantação
- `solicitations` — demandas dos corretores (status: pendente / respondida)
- `user_roles` + enum `app_role` (`admin` | `user`) — **roles em tabela separada** para evitar escalonamento de privilégios
- Função `has_role(user_id, role)` `SECURITY DEFINER` usada nas policies RLS

Aplicar as migrations num projeto Supabase novo:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## Edge Functions

Deploy automático via Lovable; manualmente:

```bash
npx supabase functions deploy lookup-solicitations
npx supabase functions deploy submit-bitrix
```

Secrets necessários: `BITRIX_WEBHOOK_TOKEN` (no painel Supabase → Edge Functions → Secrets).

## Autenticação

- Supabase Auth (e-mail/senha + Google OAuth)
- Após login no React, `sessionStorage.rsim_auth = '1'` é setado e o iframe legado pula sua tela de login interna (detecta `window.self !== window.top`)
- Painel `/admin` restrito a usuários com role `admin` (verificada via `has_role`)

## Setor Implantação — checklist por operadora

O arquivo `public/rsim.html` contém o objeto `CHECKLIST_OPERADORAS` com a lista de documentos exigidos por operadora (Bradesco, Amil, Hapvida, São Cristóvão, SulAmérica, Porto Seguro, Unimed, Prevent Senior, MedSenior). Ao selecionar a operadora no formulário de Apólice PF/Adesão, o checklist e um alerta laranja aparecem dinamicamente.

## Deploy

- **Lovable:** botão **Publish** no editor (frontend) — edge functions e migrations sobem automaticamente
- **Self-host:** qualquer host estático (Vercel, Netlify, Cloudflare Pages) para o frontend; backend permanece no Supabase

## Scripts npm

| Comando | Descrição |
|---|---|
| `dev` | Servidor Vite em `http://localhost:8080` |
| `build` | Build de produção em `dist/` |
| `preview` | Serve o build local |
| `lint` | ESLint |
| `test` | Vitest |

## Licença

Proprietário — RSIM Consultoria.
