# Pendências e Decisões Adiadas

Este documento rastreia funcionalidades e decisões que foram simplificadas ou adiadas para implementação futura.

---

## Edição de Campanhas

### Implementado

- Página de edição dedicada (`/dashboard/campaigns/[id]/edit`)
- `CampaignForm` unificado para criação e edição
- Campos bloqueados após ativação (CPM, tipo, plataformas)
- Orçamento e payout máximo só podem aumentar após ativação
- Transação atômica ao aumentar orçamento (debita diferença da carteira)
- Dialog de confirmação mostrando impacto financeiro antes de salvar

### Versionamento de Requirements

**Status:** Adiado

**Problema:** Quando um criador edita os requisitos de uma campanha ativa, clippers que já estavam trabalhando baseados nos requisitos antigos podem ser prejudicados.

**Solução Proposta:**

- Adicionar campo `requirementsVersion` na tabela `campaigns`
- Adicionar campo `approvedWithVersion` na tabela `clips`
- Ao aprovar um clip, salvar a versão dos requirements que ele seguiu
- Na UI, mostrar qual versão dos requirements cada clip foi aprovado

**Impacto de não ter:** Clippers podem ter trabalho rejeitado por não seguir requisitos que não existiam quando começaram.

---

### Audit Log de Edições

**Status:** Adiado

**Problema:** Sem log de auditoria, não temos histórico de mudanças em campanhas para resolver disputas.

**Solução Proposta:**

```sql
CREATE TABLE campaign_edits (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  field TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  edited_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Impacto de não ter:** Dificuldade em resolver disputas sobre "o que estava escrito quando eu submeti".

---

### Notificações para Clippers

**Status:** Adiado

**Problema:** Quando uma campanha é pausada, clippers que estavam trabalhando nela não são notificados.

**Solução Proposta:**

- Enviar email/notificação quando campanha muda de status
- Mostrar na UI do clipper quais campanhas que ele acompanha mudaram de status

**Impacto de não ter:** Clipper pode continuar trabalhando em campanha que foi pausada/cancelada.

---

### Sistema de Reputação para Criadores

**Status:** Não iniciado

**Problema:** Criadores que pausam campanhas frequentemente podem prejudicar clippers, mas não há forma de identificá-los.

**Possíveis métricas:**

- Número de pausas por campanha
- Tempo médio que campanhas ficam ativas
- Taxa de aprovação de clips
- Feedback dos clippers

**Impacto de não ter:** Clippers não conseguem identificar criadores problemáticos.

---

## Submissão de Clips

### Verificação de Ownership para TikTok

**Status:** Simplificado

**Implementação atual:** Para TikTok, confiamos no código de verificação sem validar automaticamente (a API do TikTok é mais restrita que a do YouTube).

**Solução ideal:** Implementar verificação via API do TikTok ou fluxo de OAuth para confirmar propriedade.

---

## Transações Financeiras

### Implementado

- Criação de campanha: transação atômica (verifica saldo, debita, cria campanha, registra transaction)
- Aumento de orçamento: transação atômica (verifica saldo, debita diferença, atualiza campanha, registra transaction)
- Deleção de campanha DRAFT: reembolso completo
- Cancelamento de campanha ACTIVE/PAUSED: reembolso do saldo restante (budget - spent)
- Earnings de clippers: transação atômica ao atualizar views
- Withdrawal: transação atômica com verificação de saldo
- Deposit: transação atômica via webhook do Stripe
- Dialog de confirmação no frontend para operações que movimentam dinheiro

### Auditoria de Transações

**Status:** Implementado parcialmente

Todas as movimentações financeiras criam registros na tabela `transactions` com:
- Tipo da operação (DEPOSIT, WITHDRAWAL, CAMPAIGN_FUND, CAMPAIGN_REFUND, EARNING, etc)
- Valor (positivo para crédito, negativo para débito)
- Saldo após operação
- Referências opcionais (campaignId, clipId, depositId, withdrawalId)
- Descrição legível

**Pendente:** Interface para visualizar histórico completo de transações.

---

_Última atualização: Janeiro 2026_
