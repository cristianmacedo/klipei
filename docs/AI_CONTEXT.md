# Klipei - Contexto para IA

Este documento contém todo o contexto necessário para trabalhar neste projeto.

---

## Visão Geral

**Klipei** é uma plataforma brasileira de Content Rewards, inspirada no Whop. Conecta:
- **Criadores** (marcas/creators): Criam campanhas e pagam por views
- **Clippers**: Produzem cortes/vídeos e são remunerados por visualizações

**Proposta de valor:** Versão brasileira do sistema de recompensas por conteúdo do Whop, com foco em simplicidade e pagamentos via PIX.

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Framework | Next.js (App Router) | 16.x |
| Auth | Supabase Auth | - |
| Database | PostgreSQL (Supabase) | - |
| ORM | Drizzle ORM | 0.45.x |
| Pagamentos | Stripe | - |
| UI | Tailwind CSS + shadcn/ui | v4 |
| Validação | Zod | 4.x |
| Forms | React Hook Form | 7.x |
| Gráficos | Recharts | 3.x |
| Icons | Lucide React | - |
| Deploy | Vercel (planejado) | - |

---

## Estrutura de Pastas

```
klipei/
├── docs/                    # Documentação
│   ├── PLANNING.md          # Requisitos e planejamento completo
│   ├── PENDING.md           # Pendências e decisões adiadas
│   └── AI_CONTEXT.md        # Este arquivo
├── drizzle/                 # Migrations do banco
├── src/
│   ├── app/
│   │   ├── (auth)/          # Rotas de autenticação (login, signup)
│   │   ├── api/             # API Routes
│   │   │   ├── campaigns/   # CRUD campanhas
│   │   │   ├── clips/       # Submissões e review
│   │   │   ├── earnings/    # Ganhos e histórico
│   │   │   ├── checkout/    # Stripe checkout
│   │   │   ├── webhooks/    # Stripe webhooks
│   │   │   └── withdrawals/ # Saques
│   │   ├── auth/callback/   # OAuth callback
│   │   ├── campaigns/       # Páginas públicas de campanhas
│   │   ├── dashboard/       # Área logada
│   │   │   ├── campaigns/   # Gerenciar campanhas (creator)
│   │   │   ├── clips/       # Meus clips (clipper)
│   │   │   ├── explore/     # Descobrir campanhas
│   │   │   ├── submissions/ # Submissões recebidas (creator)
│   │   │   ├── wallet/      # Carteira
│   │   │   └── settings/    # Configurações
│   │   ├── globals.css      # Design system (CSS variables)
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── dashboard/       # Componentes do dashboard
│   │   └── ui/              # shadcn/ui components
│   ├── db/
│   │   ├── index.ts         # Conexão com banco
│   │   └── schema.ts        # Schema Drizzle
│   ├── lib/
│   │   ├── stripe.ts        # Config Stripe
│   │   ├── supabase/        # Clients Supabase
│   │   ├── utils.ts         # Utilitários (cn, etc)
│   │   └── youtube.ts       # API YouTube
│   ├── middleware.ts        # Auth middleware
│   └── types/               # Tipos e constantes
└── package.json
```

---

## Schema do Banco de Dados

### Enums

```typescript
UserRole: "CREATOR" | "CLIPPER"
CampaignType: "CLIPPING" | "UGC"
CampaignStatus: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED"
ClipStatus: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED"
Platform: "YOUTUBE" | "TIKTOK" | "INSTAGRAM" | "TWITTER"
PaymentStatus: "PENDING" | "COMPLETED" | "FAILED"
TransactionType: "DEPOSIT" | "WITHDRAWAL" | "WITHDRAWAL_FEE" | "CAMPAIGN_FUND" | "CAMPAIGN_REFUND" | "EARNING" | "PLATFORM_FEE" | "REFUND"
```

### Tabelas Principais

#### users
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | ID do Supabase Auth |
| email | text (unique) | Email do usuário |
| name | text? | Nome |
| role | enum? | CREATOR ou CLIPPER (legado, não usado) |
| pixKey | text? | Chave PIX para saques |
| avatarUrl | text? | URL da foto |
| stripeCustomerId | text? | ID do cliente no Stripe |
| balance | decimal | Saldo disponível (default 0) |

#### campaigns
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | nanoid |
| creatorId | text (FK) | Dono da campanha |
| title | text | Título |
| description | text | Descrição |
| type | enum | CLIPPING ou UGC |
| platforms | text[] | Plataformas aceitas |
| budget | decimal | Orçamento total |
| spent | decimal | Quanto já foi gasto |
| ratePerMil | decimal | CPM (valor por 1k views) |
| maxPayoutPerClip | decimal? | Limite de ganho por clip |
| requirements | text[] | Tags de requisitos |
| instructions | text? | Instruções detalhadas |
| sourceContent | text? | Links para materiais |
| status | enum | DRAFT, ACTIVE, PAUSED, COMPLETED |

#### clips
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | nanoid |
| campaignId | text (FK) | Campanha relacionada |
| clipperId | text (FK) | Quem submeteu |
| platform | enum | YOUTUBE, TIKTOK, etc |
| videoUrl | text | URL do vídeo |
| videoId | text | ID extraído da URL |
| verificationCode | text | Código para verificar ownership |
| isVerified | boolean | Se ownership foi verificado |
| viewsAtSubmission | integer | Views no momento do submit |
| currentViews | integer | Views atuais |
| earnings | decimal | Ganhos calculados |
| status | enum | PENDING, APPROVED, REJECTED, FLAGGED |
| rejectionReason | text? | Motivo da rejeição |

#### deposits
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | nanoid |
| userId | text (FK) | Quem depositou |
| amount | decimal | Valor |
| stripeSessionId | text? | ID da session Stripe |
| stripePaymentId | text? | ID do pagamento |
| status | enum | PENDING, COMPLETED, FAILED |

#### withdrawals
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | nanoid |
| userId | text (FK) | Quem sacou |
| amount | decimal | Valor bruto |
| fee | decimal | Taxa cobrada |
| netAmount | decimal | Valor líquido |
| pixKey | text | Chave PIX usada |
| status | enum | PENDING, COMPLETED, FAILED |

#### transactions
Registro de todas as movimentações financeiras.
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | text (PK) | nanoid |
| userId | text (FK) | Usuário relacionado |
| type | enum | Tipo da transação |
| amount | decimal | Valor (+/-) |
| balanceAfter | decimal | Saldo após operação |
| clipId | text? | FK opcional |
| campaignId | text? | FK opcional |
| depositId | text? | FK opcional |
| withdrawalId | text? | FK opcional |
| description | text? | Descrição legível |

---

## Fluxos Principais

### Fluxo do Criador (Creator)
1. Cadastra/loga
2. Deposita dinheiro via Stripe (PIX ou cartão)
3. Cria campanha (título, descrição, CPM, orçamento, plataformas)
4. Ativa campanha (debita orçamento da carteira)
5. Recebe submissões de clippers
6. Revisa: aprova ou rejeita
7. Sistema calcula ganhos automaticamente
8. Pode pausar/cancelar campanha (reembolso proporcional)

### Fluxo do Clipper
1. Cadastra/loga
2. Explora campanhas ativas
3. Submete clip (URL do YouTube/TikTok)
4. Sistema gera código de verificação
5. Clipper adiciona código na descrição do vídeo
6. Submissão fica PENDING aguardando aprovação
7. Se aprovado, views começam a contar
8. Ganhos calculados: (viewsAtuais - viewsAtSubmission) / 1000 * CPM
9. Clipper pode sacar via PIX (mínimo R$ 20)

### Cálculo de Ganhos
```typescript
viewsVálidas = currentViews - viewsAtSubmission
ganhos = MIN(
  (viewsVálidas / 1000) * ratePerMil,
  maxPayoutPerClip,     // se definido
  budgetRestante        // da campanha
)
```

---

## Design System

### Cores (CSS Variables - Dark Mode Only)

```css
--background: oklch(0.09 0.01 260)     /* Fundo principal */
--foreground: oklch(0.98 0 0)          /* Texto principal */
--card: oklch(0.13 0.01 260)           /* Fundo de cards */
--primary: oklch(0.7 0.18 160)         /* Verde principal */
--secondary: oklch(0.18 0.01 260)      /* Fundo secundário */
--muted: oklch(0.18 0.01 260)          /* Elementos mutados */
--muted-foreground: oklch(0.65 0 0)    /* Texto secundário */
--accent: oklch(0.65 0.2 45)           /* Laranja/accent */
--destructive: oklch(0.55 0.2 25)      /* Vermelho/erro */
--border: oklch(0.22 0.01 260)         /* Bordas */
--success: oklch(0.7 0.18 160)         /* Verde sucesso */
--warning: oklch(0.75 0.15 80)         /* Amarelo warning */
```

### Cores de Plataformas
```typescript
const platformColors = {
  TIKTOK: "bg-[#ff0050]/20 text-[#ff0050]",
  YOUTUBE: "bg-[#ff0000]/20 text-[#ff4444]",
  INSTAGRAM: "bg-[#e4405f]/20 text-[#e4405f]",
  TWITTER: "bg-[#1da1f2]/20 text-[#1da1f2]",
};

const platformLabels = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  INSTAGRAM: "Instagram",
  TWITTER: "Twitter",
};
```

### Cores de Status
```typescript
const statusColors = {
  PENDING: "bg-warning/20 text-warning",
  APPROVED: "bg-success/20 text-success",
  REJECTED: "bg-destructive/20 text-destructive",
  ACTIVE: "bg-success/20 text-success",
  PAUSED: "bg-warning/20 text-warning",
  COMPLETED: "bg-muted text-muted-foreground",
  DRAFT: "bg-muted text-muted-foreground",
};
```

### Padrões Visuais Implementados

1. **Stat Cards com Ícones**
   - Ícone à esquerda em container quadrado com cor de fundo
   - Título em texto muted, valor em negrito
   - Usado em: Dashboard, Meus Clips, Campanhas, Explorar, Submissões, Carteira

2. **Quick Filters (Filtros Rápidos)**
   - Barra de botões com fundo `bg-muted/50 rounded-lg`
   - Botão ativo: `bg-background shadow-sm`
   - Usado em: Meus Clips, Minhas Campanhas, Explorar, Submissões

3. **Cards de Campanha**
   - Título + badge de status
   - Nome do criador abaixo
   - Badges de plataforma com cores
   - Barra de progresso do orçamento
   - Footer com views, clippers, link

4. **Cards de Submissão**
   - Avatar com iniciais
   - Nome + badge de status + badge de plataforma
   - Título da campanha
   - Views + ganhos
   - Ações (ver vídeo, aprovar/rejeitar)

5. **Tabelas**
   - `rounded-xl border border-border bg-card overflow-hidden`
   - Headers em `text-muted-foreground`
   - Linhas com `border-border`

---

## Navegação do Dashboard

```typescript
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Minhas Campanhas", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Explorar", href: "/dashboard/explore", icon: Compass },
  { name: "Meus Clips", href: "/dashboard/clips", icon: Film },
  { name: "Submissões", href: "/dashboard/submissions", icon: ClipboardCheck },
  { name: "Carteira", href: "/dashboard/wallet", icon: Wallet },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];
```

---

## Constantes Importantes

```typescript
// src/types/index.ts
export const MINIMUM_WITHDRAWAL_AMOUNT = 20; // R$ 20
export const WITHDRAWAL_FEE_PERCENTAGE = 0.05; // 5%
```

---

## Integrações Externas

### Supabase
- Auth: Login com email/senha e Google OAuth
- Database: PostgreSQL hospedado

### Stripe
- Checkout: Depósitos via PIX e cartão
- Webhook: `/api/webhooks/stripe` para confirmar pagamentos

### YouTube Data API
- Buscar views de vídeos automaticamente
- Endpoint: `GET /videos?part=statistics&id={videoId}`

### TikTok
- **Não há API viável** - views são informadas manualmente pelo clipper

---

## Pendências e Decisões em Aberto

### Dashboard Bias
O dashboard atual é focado no perfil de **Creator**:
- Seção "Minhas campanhas" (creator)
- Seção "Submissões recentes" (creator - submissions para review)
- Stats no topo cobrem ambos os perfis

**Opções discutidas:**
1. Adicionar "Meus clips recentes" para clippers
2. Dashboard adaptativo baseado na atividade do usuário
3. Manter como está (stats cobrem clipper, página dedicada existe)
4. Trocar seções: "Meus clips" à esquerda, "Submissões" à direita

### Funcionalidades Adiadas (ver PENDING.md)
- Versionamento de requirements
- Audit log de edições
- Notificações para clippers
- Sistema de reputação
- Auto-aprovação após 48h
- Sistema de disputas

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Banco de dados
npm run db:generate   # Gerar migrations
npm run db:migrate    # Aplicar migrations
npm run db:push       # Push direto (dev)
npm run db:studio     # UI do Drizzle

# Build
npm run build
npm run lint
```

---

## Arquivos Importantes para Referência

| Arquivo | Descrição |
|---------|-----------|
| `src/db/schema.ts` | Schema completo do banco |
| `src/app/globals.css` | Design system (cores) |
| `docs/PLANNING.md` | Requisitos detalhados |
| `docs/PENDING.md` | Pendências e decisões |
| `src/components/dashboard/` | Componentes do dashboard |

---

## Convenções de Código

1. **Idioma**: Interface 100% em português brasileiro
2. **Imports**: Usar `@/` para paths absolutos
3. **Componentes**: Client components marcados com `"use client"`
4. **Server Components**: Páginas são server components por padrão
5. **API Routes**: Route handlers em `app/api/`
6. **Validação**: Zod para schemas
7. **Forms**: React Hook Form + zodResolver
8. **Toast**: Sonner para notificações

---

_Última atualização: Janeiro 2026_
