# Klipei

**Marketing por performance. Pague apenas por views reais.**

Klipei conecta marcas a clippers que divulgam seu conteúdo e ganham por visualização. Você define o orçamento, eles criam os cortes — você só paga pelas views que eles geram.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **ORM**: Drizzle
- **Payments**: Stripe
- **UI**: Tailwind CSS + shadcn/ui

## Começando

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database (Supabase → Project Settings → Database → Connection String)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Auth (Project Settings → API → API Keys)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# Stripe (Developers → API keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# YouTube API (opcional)
YOUTUBE_API_KEY="your-youtube-api-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Criar tabelas no banco

```bash
npm run db:push
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts do Banco

```bash
npm run db:push      # Sincroniza schema com o banco
npm run db:generate  # Gera migrations
npm run db:migrate   # Aplica migrations
npm run db:studio    # Abre Drizzle Studio
```

## Funcionalidades

### Para Criadores / Marcas

- Criar campanhas de Content Rewards
- Definir orçamento e taxa por 1.000 views
- Revisar e aprovar submissões
- Acompanhar métricas de performance

### Para Clippers

- Encontrar campanhas para participar
- Submeter vídeos com verificação de ownership
- Acompanhar ganhos por visualização
- Solicitar saques via PIX

## Estrutura do Projeto

```
src/
├── app/                    # App Router (páginas e API routes)
│   ├── (auth)/             # Páginas de autenticação
│   ├── api/                # API routes
│   ├── campaigns/          # Páginas de campanhas
│   └── dashboard/          # Dashboards
├── components/             # Componentes React
├── db/                     # Schema Drizzle e conexão
├── lib/                    # Utilitários e configurações
└── types/                  # Types TypeScript
```

## Deploy

Deploy na Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/seu-usuario/klipei)

## Licença

MIT
