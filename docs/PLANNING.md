# Klipei - Planejamento Técnico

## Visão Geral

Plataforma brasileira de Content Rewards, inspirada no Whop. Conecta criadores de conteúdo (marcas) com clippers que produzem cortes/vídeos e são remunerados por visualizações.

**Proposta de valor:** Versão brasileira do sistema de recompensas por conteúdo do Whop, com foco em simplicidade e pagamentos via PIX.

---

## Requisitos Funcionais

### RF01 - Autenticação & Gestão de Usuários

| ID     | Requisito            | Prioridade | Detalhes                                                         |
| ------ | -------------------- | ---------- | ---------------------------------------------------------------- |
| RF01.1 | Cadastro de usuário  | Alta       | Usuário pode se cadastrar com email/senha ou Google OAuth        |
| RF01.2 | Login                | Alta       | Usuário pode fazer login com credenciais ou OAuth                |
| RF01.3 | Seleção de perfil    | Alta       | No primeiro acesso, usuário escolhe se é Criador ou Clipper      |
| RF01.4 | Edição de perfil     | Média      | Usuário pode editar nome, foto, e dados de pagamento (chave PIX) |
| RF01.5 | Logout               | Alta       | Usuário pode encerrar sessão                                     |
| RF01.6 | Recuperação de senha | Baixa      | Usuário pode resetar senha via email (MVP: pode ser manual)      |

**Regras de negócio:**

- Um usuário só pode ter um perfil (Criador OU Clipper, não ambos)
- Email deve ser único no sistema
- Chave PIX é obrigatória para Clippers receberem pagamentos

---

### RF02 - Gestão de Campanhas (Criador)

| ID     | Requisito                | Prioridade | Detalhes                                                |
| ------ | ------------------------ | ---------- | ------------------------------------------------------- |
| RF02.1 | Criar campanha           | Alta       | Criador preenche formulário com dados da campanha       |
| RF02.2 | Listar minhas campanhas  | Alta       | Criador vê todas suas campanhas com status e métricas   |
| RF02.3 | Editar campanha          | Média      | Criador pode editar campanhas em status DRAFT ou PAUSED |
| RF02.4 | Ativar campanha          | Alta       | Criador ativa campanha (muda status para ACTIVE)        |
| RF02.5 | Pausar campanha          | Média      | Criador pausa campanha (para de aceitar submissões)     |
| RF02.6 | Encerrar campanha        | Média      | Criador encerra campanha definitivamente                |
| RF02.7 | Ver detalhes da campanha | Alta       | Criador vê estatísticas, submissões e gastos            |

**Campos da campanha:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| Título | string | Sim | 5-100 caracteres |
| Descrição | text | Sim | 20-2000 caracteres |
| Tipo | enum | Sim | CLIPPING ou UGC |
| Plataformas | array | Sim | Pelo menos 1 selecionada |
| Orçamento total | decimal | Sim | Mínimo R$ 50,00 |
| Valor por 1k views | decimal | Sim | Mínimo R$ 0,50, máximo R$ 50,00 |
| Payout máximo por clip | decimal | Não | Se definido, limita ganho por submissão |
| Requisitos | array[string] | Não | Tags com requisitos do conteúdo (ex: "Mínimo 30s", "Vertical") |
| Instruções | text | Não | Regras específicas para clippers (texto livre) |
| Conteúdo fonte | text | Não | Links externos (Drive, Dropbox, etc.) com materiais para clippers |
| Thumbnail/Banner | url | Não | Imagem de capa da campanha |

**Exemplos de requisitos (tags):**

```
["Mínimo 30 segundos", "Máximo 3 minutos", "Formato vertical (9:16)",
 "Mencionar o produto", "Incluir CTA no final", "Sem palavrões",
 "Usar áudio original", "Legendas obrigatórias"]
```

**Regras de negócio:**

- Campanha só pode ser ativada se orçamento > 0
- Campanha é automaticamente pausada se orçamento restante < valor de 1k views
- Campanha COMPLETED não pode voltar a outro status

**Campos bloqueados após ACTIVE:**

- `budget` - não pode ser reduzido (apenas adicionar mais)
- `ratePerMil` - não pode ser alterado (evita bait-and-switch)
- `maxPayoutPerClip` - não pode ser alterado

Demais campos (título, descrição, instruções, etc.) podem ser editados a qualquer momento.

**Fluxo de status:**

```
DRAFT → ACTIVE → PAUSED → ACTIVE (pode alternar)
                    ↓
              COMPLETED (final)
```

---

### RF03 - Descoberta e Submissão de Clips (Clipper)

| ID     | Requisito                 | Prioridade | Detalhes                                             |
| ------ | ------------------------- | ---------- | ---------------------------------------------------- |
| RF03.1 | Listar campanhas ativas   | Alta       | Clipper vê campanhas ACTIVE com orçamento disponível |
| RF03.2 | Filtrar campanhas         | Média      | Filtros por tipo (CLIPPING/UGC) e plataforma         |
| RF03.3 | Ver detalhes da campanha  | Alta       | Clipper vê regras, valores e instruções              |
| RF03.4 | Submeter clip             | Alta       | Clipper envia link do vídeo para uma campanha        |
| RF03.5 | Listar minhas submissões  | Alta       | Clipper vê todas suas submissões e status            |
| RF03.6 | Ver detalhes da submissão | Alta       | Clipper vê views, ganhos e feedback                  |
| RF03.7 | Cancelar submissão        | Baixa      | Clipper pode cancelar submissão PENDING              |

**Campos da submissão:**
| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| URL do vídeo | string | Sim | URL válida do YouTube ou TikTok |
| Plataforma | enum | Auto | Detectado automaticamente pela URL |
| Video ID | string | Auto | Extraído automaticamente da URL |
| Código de verificação | string | Auto | Gerado pelo sistema para comprovar ownership |
| Views no momento do submit | integer | Auto | Capturado via API no momento da submissão |
| Comentário | text | Não | Mensagem opcional para o criador |
| Views (TikTok) | integer | Condicional | Obrigatório se plataforma = TikTok |

**Verificação de Ownership (Anti-fraude):**

O clipper precisa provar que é dono do vídeo antes da submissão ser aceita:

1. Clipper informa URL do vídeo
2. Sistema gera código único (ex: `KLIPEI-A7X9K2`)
3. Clipper adiciona o código na **descrição do vídeo** no YouTube/TikTok
4. Sistema verifica via API se o código está presente na descrição
5. Se verificado → submissão criada com status PENDING
6. Se não verificado → submissão bloqueada, clipper pode tentar novamente

```
Fluxo de submissão:
URL informada → Código gerado → Clipper adiciona na descrição → Verificação API → Submissão criada
```

**Regras de negócio:**

- Clipper não pode submeter mesmo vídeo duas vezes na mesma campanha
- Clipper pode submeter mesmo vídeo em campanhas diferentes
- URL deve ser de domínio permitido (youtube.com, youtu.be, tiktok.com)
- Submissão só é aceita se campanha está ACTIVE e tem orçamento
- **Views são capturadas no momento do submit** - apenas views APÓS esse momento contam para ganhos
- **Código de verificação deve estar na descrição** - prova de ownership obrigatória

---

### RF04 - Revisão de Submissões (Criador)

| ID     | Requisito                   | Prioridade | Detalhes                                              |
| ------ | --------------------------- | ---------- | ----------------------------------------------------- |
| RF04.1 | Listar submissões pendentes | Alta       | Criador vê submissões aguardando revisão              |
| RF04.2 | Visualizar vídeo            | Alta       | Criador pode assistir o vídeo (embed ou link externo) |
| RF04.3 | Aprovar submissão           | Alta       | Criador aprova, clip começa a acumular ganhos         |
| RF04.4 | Rejeitar submissão          | Alta       | Criador rejeita com motivo obrigatório                |
| RF04.5 | Marcar como flagged         | Média      | Criador sinaliza conteúdo suspeito para análise       |
| RF04.6 | Filtrar por status          | Média      | Ver submissões por status (PENDING, APPROVED, etc.)   |
| RF04.7 | Buscar submissões           | Baixa      | Buscar por clipper ou URL                             |

**Motivos de rejeição (predefinidos + custom):**

- Conteúdo não relacionado à campanha
- Qualidade abaixo do esperado
- Violação de diretrizes
- Conteúdo duplicado
- Outro (campo livre)

**Regras de negócio:**

- Criador só pode revisar submissões de suas próprias campanhas
- Submissão aprovada não pode ser revertida para rejeitada
- Submissão rejeitada não pode ser revertida
- Motivo de rejeição é visível para o clipper

**Fluxo de status da submissão:**

```
PENDING → APPROVED (começa tracking de views)
    ↓
REJECTED (final, com motivo)
    ↓
FLAGGED → APPROVED ou REJECTED (após análise)
```

---

### RF05 - Tracking de Views e Cálculo de Ganhos

| ID     | Requisito                   | Prioridade | Detalhes                                              |
| ------ | --------------------------- | ---------- | ----------------------------------------------------- |
| RF05.1 | Capturar views iniciais     | Alta       | No momento do submit, registrar views atuais do vídeo |
| RF05.2 | Buscar views do YouTube     | Alta       | Sistema consulta YouTube API para clips aprovados     |
| RF05.3 | Registrar views manualmente | Alta       | Para TikTok, clipper informa views atuais             |
| RF05.4 | Calcular views válidas      | Alta       | viewsVálidas = viewsAtuais - viewsNoSubmit            |
| RF05.5 | Calcular ganhos             | Alta       | Sistema calcula: (viewsVálidas / 1000) × ratePerMil   |
| RF05.6 | Aplicar limite de payout    | Média      | Se campanha tem maxPayout, respeitar limite           |
| RF05.7 | Atualizar orçamento         | Alta       | Deduzir ganhos do orçamento da campanha               |
| RF05.8 | Histórico de views          | Média      | Manter log de evolução de views ao longo do tempo     |

**Fórmula de ganhos (atualizada):**

```
// Só contam views APÓS o momento do submit
viewsVálidas = viewsAtuais - viewsAtSubmission

ganhos = MIN(
  (viewsVálidas / 1000) × ratePerMil,
  maxPayoutPerClip,      // se definido na campanha
  budgetRestante         // não pode exceder orçamento disponível
)
```

**Exemplo prático:**

```
Vídeo tinha 10.000 views no momento do submit
Vídeo agora tem 25.000 views
viewsVálidas = 25.000 - 10.000 = 15.000
Se ratePerMil = R$ 2,00 → ganhos = (15.000 / 1.000) × 2 = R$ 30,00
```

**Regras de negócio:**

- Views só são contabilizadas após aprovação
- **Views anteriores ao submit não contam** - evita fraude com vídeos virais pré-existentes
- Atualização de views do YouTube: a cada 6 horas (cron job) ou manual
- Views do TikTok: clipper atualiza manualmente, criador pode contestar
- Ganhos são calculados em tempo real, mas payout é separado
- Se orçamento acabar, campanha é pausada automaticamente

---

### RF06 - Dashboards e Relatórios

| ID     | Requisito            | Prioridade | Detalhes                               |
| ------ | -------------------- | ---------- | -------------------------------------- |
| RF06.1 | Dashboard do Criador | Alta       | Visão geral das campanhas e métricas   |
| RF06.2 | Dashboard do Clipper | Alta       | Visão geral de submissões e ganhos     |
| RF06.3 | Métricas da campanha | Alta       | Views totais, gastos, ROI básico       |
| RF06.4 | Histórico de ganhos  | Média      | Clipper vê evolução de ganhos no tempo |
| RF06.5 | Export de dados      | Baixa      | Download de relatório (CSV) - Fase 2   |

**Dashboard do Criador - Componentes:**

- Total de campanhas (por status)
- Orçamento total alocado vs gasto
- Submissões pendentes de revisão
- Top clips por performance
- Gráfico de gastos ao longo do tempo

**Dashboard do Clipper - Componentes:**

- Total de submissões (por status)
- Ganhos totais acumulados
- Ganhos pendentes de pagamento
- Campanhas participando
- Gráfico de ganhos ao longo do tempo

---

### RF07 - Pagamentos (Stripe)

| ID     | Requisito                | Prioridade | Detalhes                                            |
| ------ | ------------------------ | ---------- | --------------------------------------------------- |
| RF07.1 | Depositar orçamento      | Alta       | Criador paga via Stripe Checkout (PIX ou cartão)    |
| RF07.2 | Webhook de confirmação   | Alta       | Stripe notifica pagamento → credita budget          |
| RF07.3 | Solicitar saque          | Alta       | Clipper solicita transferência de ganhos            |
| RF07.4 | Processar saque (manual) | Alta       | Admin transfere via PIX, marca como pago            |
| RF07.5 | Histórico de transações  | Média      | Registro de depósitos e saques                      |
| RF07.6 | Stripe Connect (futuro)  | Fase 2     | Clipper faz onboarding, Stripe paga automaticamente |

**Fluxo de depósito (automático via Stripe):**

```
1. Criador clica "Adicionar budget" na campanha
2. Redirect para Stripe Checkout (PIX ou cartão)
3. Criador paga
4. Stripe envia webhook para /api/webhooks/stripe
5. Sistema valida webhook e credita campaign.budget
6. Campanha muda para ACTIVE (se estava DRAFT)
```

**Fluxo de saque (manual no MVP):**

```
1. Clipper acumula ganhos (clipper.balance)
2. Clipper solicita saque (mínimo R$20)
3. Sistema cria registro de saque com status PENDING
4. Admin recebe notificação (email ou dashboard)
5. Admin faz PIX manual para chave do clipper
6. Admin marca saque como COMPLETED
7. Sistema zera clipper.balance
```

**Futuro (Stripe Connect):**

- Clipper faz onboarding no Stripe (KYC automático)
- Saques processados automaticamente via Stripe Payouts
- Zero trabalho manual

---

### RF08 - Features Futuras (Roadmap)

Features identificadas durante o planejamento, priorizadas para fases posteriores ao MVP.

#### Fase 2 - Automação e Proteção

| ID     | Feature             | Descrição                                                                                 | Benefício                              |
| ------ | ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| RF08.1 | Auto-aprovação 48h  | Submissões PENDING são automaticamente aprovadas após 48h se não forem rejeitadas         | Protege clippers de criadores inativos |
| RF08.2 | Banir clipper       | Opção de banir clipper ao rejeitar submissão (ban de uma campanha ou de todas do criador) | Combate fraude recorrente              |
| RF08.3 | Sistema de disputas | Clipper pode contestar rejeição, abre ticket para análise                                 | Resolve conflitos                      |

**Implementação RF08.1 (Auto-aprovação):**

```
Cron job a cada hora:
1. Buscar submissões com status = PENDING
2. Filtrar onde submittedAt < (now - 48h)
3. Atualizar status para APPROVED
4. Notificar criador e clipper
```

#### Fase 3 - Descoberta e Categorização

| ID     | Feature                    | Descrição                                                         | Benefício                             |
| ------ | -------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| RF08.4 | Categorias de campanha     | Campo obrigatório: Gaming, Música, Lifestyle, Tech, Fitness, etc. | Melhora descoberta e filtros          |
| RF08.5 | Vídeo tutorial da campanha | Criador adiciona link de vídeo explicando como criar conteúdo     | Reduz submissões fora do padrão       |
| RF08.6 | Tags/palavras-chave        | Criador adiciona tags, clipper busca por tags                     | SEO interno                           |
| RF08.7 | Reputação de clippers      | Score baseado em aprovações, views médios, etc.                   | Criadores encontram melhores clippers |

**Categorias sugeridas (RF08.4):**

```
GAMING | MUSIC | LIFESTYLE | TECH | FITNESS | FINANCE | EDUCATION | ENTERTAINMENT | OTHER
```

#### Fase 4 - Monetização Avançada

| ID      | Feature                  | Descrição                                                   | Benefício             |
| ------- | ------------------------ | ----------------------------------------------------------- | --------------------- |
| RF08.8  | Campanhas em destaque    | Criador paga extra para campanha aparecer no topo           | Nova fonte de receita |
| RF08.9  | Bônus fixo por submissão | Além do pagamento por views, bônus fixo por clip aprovado   | Incentiva volume      |
| RF08.10 | Níveis de clipper        | Bronze/Prata/Ouro baseado em histórico, taxas diferenciadas | Gamificação, retenção |

---

## Requisitos Não Funcionais

### RNF01 - Performance

| ID      | Requisito             | Métrica                                              |
| ------- | --------------------- | ---------------------------------------------------- |
| RNF01.1 | Tempo de carregamento | Páginas devem carregar em < 3s (LCP)                 |
| RNF01.2 | Tempo de resposta API | Endpoints devem responder em < 500ms (p95)           |
| RNF01.3 | Otimização de imagens | Imagens servidas em formatos modernos (WebP)         |
| RNF01.4 | Caching               | Dados estáticos cacheados (campanhas públicas, etc.) |

### RNF02 - Segurança

| ID      | Requisito            | Implementação                            |
| ------- | -------------------- | ---------------------------------------- |
| RNF02.1 | Autenticação segura  | JWT com refresh tokens, httpOnly cookies |
| RNF02.2 | Autorização          | Verificar ownership em todas operações   |
| RNF02.3 | Validação de input   | Sanitizar todos inputs, validar URLs     |
| RNF02.4 | Rate limiting        | Limitar requests por IP/usuário          |
| RNF02.5 | HTTPS obrigatório    | Todas conexões via TLS                   |
| RNF02.6 | Proteção CSRF        | Tokens CSRF em formulários               |
| RNF02.7 | Headers de segurança | CSP, X-Frame-Options, etc.               |

### RNF03 - Usabilidade

| ID      | Requisito           | Detalhes                                      |
| ------- | ------------------- | --------------------------------------------- |
| RNF03.1 | Responsividade      | Funcionar em mobile, tablet e desktop         |
| RNF03.2 | Acessibilidade      | Seguir WCAG 2.1 nível A (mínimo)              |
| RNF03.3 | Feedback visual     | Loading states, toasts de sucesso/erro        |
| RNF03.4 | Navegação intuitiva | Máximo 3 cliques para qualquer ação principal |
| RNF03.5 | Idioma              | Interface 100% em português brasileiro        |

### RNF04 - Disponibilidade

| ID      | Requisito     | Métrica                         |
| ------- | ------------- | ------------------------------- |
| RNF04.1 | Uptime        | 99% de disponibilidade (MVP)    |
| RNF04.2 | Recuperação   | Backup diário do banco de dados |
| RNF04.3 | Monitoramento | Alertas para erros críticos     |

### RNF05 - Escalabilidade

| ID      | Requisito            | Abordagem                                      |
| ------- | -------------------- | ---------------------------------------------- |
| RNF05.1 | Usuários simultâneos | Suportar 100 usuários simultâneos (MVP)        |
| RNF05.2 | Crescimento de dados | Schema permite milhões de clips sem degradação |
| RNF05.3 | Arquitetura          | Stateless, permite scale horizontal futuro     |

### RNF06 - Manutenibilidade

| ID      | Requisito      | Implementação                                     |
| ------- | -------------- | ------------------------------------------------- |
| RNF06.1 | Código limpo   | ESLint + Prettier configurados                    |
| RNF06.2 | Tipagem        | TypeScript strict mode                            |
| RNF06.3 | Documentação   | Comentários em lógica complexa, README atualizado |
| RNF06.4 | Versionamento  | Git com commits semânticos                        |
| RNF06.5 | Ambiente local | Docker compose ou scripts de setup documentados   |

---

## Stack Técnica

| Camada     | Tecnologia              | Justificativa                                                   |
| ---------- | ----------------------- | --------------------------------------------------------------- |
| Framework  | Next.js 14 (App Router) | Full-stack em um só projeto, Server Actions, deploy simples     |
| Auth       | Supabase Auth           | Integrado com DB, OAuth pronto, session management simplificado |
| Database   | Supabase (PostgreSQL)   | Auth + DB no mesmo lugar, free tier generoso, realtime pronto   |
| ORM        | Prisma                  | Type-safe, migrations fáceis, ótimo com Next.js                 |
| Pagamentos | Stripe                  | Checkout para depósitos, Payouts/Connect para saques futuros    |
| UI         | Tailwind + shadcn/ui    | Componentes bonitos, customizáveis, sem runtime                 |
| Deploy     | Vercel                  | Integração nativa com Next.js, free tier pro MVP                |

### Decisões Descartadas

- ❌ **Turborepo/Monorepo**: Overhead desnecessário para dev solo em 2 semanas
- ❌ **Clerk**: Vendor lock-in, custo futuro ($25/mês após 10k MAU)
- ❌ **NextAuth**: Supabase Auth mais simples quando já usamos Supabase
- ❌ **Neon**: Supabase oferece auth + db integrados
- ❌ **Backend separado (Express/Nest)**: Next.js API Routes + Server Actions resolvem

### Sistema de Pagamentos (Stripe)

**Depósitos (Criador → Klipei):**

- Stripe Checkout com PIX e cartão
- Webhook confirma pagamento → credita budget da campanha
- 100% automático

**Saques (Klipei → Clipper):**

- **MVP:** Clipper solicita saque, você transfere via PIX manualmente
- **Futuro:** Stripe Connect - clipper faz onboarding, Stripe paga direto

```
Fluxo MVP de saque:
1. Clipper solicita saque (mínimo R$X)
2. Sistema registra solicitação com status PENDING
3. Você recebe notificação
4. Você faz PIX manual pro clipper
5. Marca como COMPLETED no sistema
```

---

## Escopo MVP (2 semanas)

### ✅ Incluído no MVP

#### Autenticação & Usuários

- [ ] Login/cadastro (Google OAuth + email/senha)
- [ ] Dois perfis: Criador e Clipper
- [ ] Página de perfil básica

#### Campanhas (Criador)

- [ ] Criar campanha (título, descrição, tipo, plataformas aceitas)
- [ ] Definir orçamento total e valor por 1k views
- [ ] Listar minhas campanhas
- [ ] Pausar/encerrar campanha

#### Submissões (Clipper)

- [ ] Listar campanhas disponíveis (com filtros básicos)
- [ ] Submeter clip (link do YouTube/TikTok)
- [ ] Ver minhas submissões e status

#### Revisão (Criador)

- [ ] Painel de submissões pendentes
- [ ] Aprovar/rejeitar submissão
- [ ] Ver submissões aprovadas e métricas

#### Métricas & Views

- [ ] Integração YouTube Data API (puxar views automaticamente)
- [ ] TikTok: input manual de views pelo clipper (validação futura)
- [ ] Cálculo de ganhos: (views / 1000) × valor_por_mil

#### Dashboards

- [ ] Criador: campanhas ativas, orçamento restante, submissões pendentes
- [ ] Clipper: submissões, ganhos acumulados

#### Outros

- [ ] Landing page
- [ ] Páginas de erro (404, 500)

### ❌ Fora do MVP (Fase 2+)

- Pagamento automatizado (PIX via Mercado Pago/OpenPix)
- Auto-aprovação por timeout (48h)
- Sistema anti-fraude avançado
- TikTok API automática
- Instagram/Reels/X
- Notificações por email
- Sistema de disputas
- Campanhas em destaque (promoted)
- App mobile

---

## Cronograma Estimado

| Dia | Foco       | Entregas                                          |
| --- | ---------- | ------------------------------------------------- |
| 1   | Setup      | Projeto Next.js, Prisma, Neon, NextAuth config    |
| 2-3 | Auth       | Login/signup, providers, perfis criador/clipper   |
| 4-5 | Campanhas  | CRUD completo, formulários, listagem              |
| 6-7 | Submissões | Submeter clips, listagem, vinculação com campanha |
| 8-9 | Revisão    | Painel de aprovação, status, fluxo completo       |
| 10  | YouTube    | Integração API, buscar views, calcular ganhos     |
| 11  | Dashboards | Estatísticas criador e clipper                    |
| 12  | Landing    | Página inicial, marketing básico                  |
| 13  | Polish     | Testes, bugs, deploy final                        |

---

## Modelo de Dados (Preliminar)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   User          │────<│  Campaign       │────<│    Clip             │
├─────────────────┤     ├─────────────────┤     ├─────────────────────┤
│ id              │     │ id              │     │ id                  │
│ email           │     │ creatorId       │     │ campaignId          │
│ name            │     │ title           │     │ clipperId           │
│ role            │     │ description     │     │ platform            │
│ pixKey?         │     │ type            │     │ videoUrl            │
│ avatarUrl?      │     │ platforms[]     │     │ videoId             │
│ createdAt       │     │ budget          │     │ verificationCode    │  ← código para provar ownership
│ updatedAt       │     │ ratePerMil      │     │ isVerified          │  ← ownership confirmado?
└─────────────────┘     │ maxPayoutPerClip│     │ viewsAtSubmission   │  ← views no momento do submit
                        │ requirements[]  │  ← tags de requisitos (ex: "Mínimo 30s")
                        │ instructions    │     │ currentViews        │  ← views atuais
                        │ sourceContent?  │  ← links externos (Drive, etc.) com materiais
                        │ thumbnailUrl    │     │ earnings            │  ← ganhos calculados
                        │ status          │     │ status              │
                        │ spent           │     │ rejectionReason?    │  ← motivo se rejeitado
                        │ createdAt       │     │ submittedAt         │
                        │ updatedAt       │     │ reviewedAt?         │
                        └─────────────────┘     │ createdAt           │
                                                │ updatedAt           │
                                                └─────────────────────┘
```

### Enums

```
UserRole: CREATOR | CLIPPER
CampaignType: CLIPPING | UGC
CampaignStatus: DRAFT | ACTIVE | PAUSED | COMPLETED
ClipStatus: PENDING | APPROVED | REJECTED | FLAGGED
Platform: YOUTUBE | TIKTOK | INSTAGRAM | TWITTER
```

### Campos Novos (Anti-fraude)

| Campo               | Tabela | Propósito                                               |
| ------------------- | ------ | ------------------------------------------------------- |
| `verificationCode`  | Clip   | Código único que clipper adiciona na descrição do vídeo |
| `isVerified`        | Clip   | Boolean indicando se ownership foi verificado via API   |
| `viewsAtSubmission` | Clip   | Views do vídeo no momento do submit (baseline)          |
| `currentViews`      | Clip   | Views atuais (atualizado periodicamente)                |
| `rejectionReason`   | Clip   | Motivo da rejeição (visível pro clipper)                |

---

## Integrações Externas

### YouTube Data API v3

- **Uso:** Buscar estatísticas de vídeos (views)
- **Endpoint:** `GET /videos?part=statistics&id={videoId}`
- **Limite:** 10.000 unidades/dia (free tier)
- **Custo por request:** ~1-3 unidades
- **Suficiente para MVP:** ✅ Sim

### TikTok

- **Problema:** API pública não permite buscar views de vídeos de terceiros
- **Solução MVP:** Clipper informa views manualmente, criador valida
- **Futuro:** Avaliar TikTok Research API ou scraping

### Pagamentos (Stripe)

- **Depósitos:** Stripe Checkout (PIX + cartão) - automático desde o MVP
- **Saques MVP:** Clipper solicita, admin paga via PIX manual
- **Saques futuro:** Stripe Connect para payouts automáticos
- **Taxas Stripe:** ~3.5% cartão, ~1% PIX (pago pelo criador no depósito)

---

## Considerações de Segurança

- [ ] Rate limiting nas API routes
- [ ] Validação de URLs (só aceitar youtube.com, tiktok.com, etc.)
- [ ] Sanitização de inputs
- [ ] CSRF protection (Next.js já tem)
- [ ] Verificação de ownership (criador só vê suas campanhas, etc.)

---

## Riscos Identificados

| Risco                       | Probabilidade | Impacto | Mitigação MVP                                  | Mitigação Futura                                       |
| --------------------------- | ------------- | ------- | ---------------------------------------------- | ------------------------------------------------------ |
| YouTube API quota estourar  | Baixa (MVP)   | Alto    | Cache agressivo, requests batch                | Upgrade de quota, múltiplas API keys                   |
| TikTok não ter API viável   | Alta          | Médio   | Input manual, validação por criador            | TikTok Research API, scraping                          |
| Fraude de views             | Média         | Alto    | Confiança nas plataformas, flags manuais       | Sistema de detecção automática                         |
| Prazo estourar              | Média         | Médio   | Escopo já cortado, priorizar core features     | -                                                      |
| Re-upload de conteúdo       | Alta          | Alto    | Criador detecta na revisão, motivo "duplicado" | Fingerprinting de vídeo, detecção por duração/metadata |
| Clipper não é dono do vídeo | Média         | Alto    | Verificação via código na descrição            | OAuth do YouTube para verificar canal                  |

---

## Monetização (Referência Whop)

Modelo planejado (não implementado no MVP):

- **Taxa de plataforma:** ~3-5% sobre transações
- **Taxa de payout:** ~10% quando clipper recebe (modelo Whop)
- **Futuro:** Campanhas em destaque (promoted), fees por features premium

Ver `WHOP_MONETIZATION.md` para detalhes do modelo de referência.

---

## Próximos Passos

1. [ ] Finalizar schema Prisma
2. [ ] Configurar projeto Next.js + dependências
3. [ ] Setup Neon database
4. [ ] Configurar NextAuth com Google OAuth
5. [ ] Começar desenvolvimento

---

_Última atualização: Janeiro 2026_
