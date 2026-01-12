# Dino CRM 🦕

CRM Conversacional Inteligente desenvolvido para a **Barbearia Seu Dino**. Este projeto integra uma interface moderna de chat (estilo WhatsApp) com um backend automatizado por IA para agendamentos e vendas.

## 🛠️ Tecnologias

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui.
- **Backend / DB**: Supabase (PostgreSQL).
- **IA**: Supabase Edge Functions + OpenRouter (Gemini Model).

---

## 🚀 Guia de Instalação (Passo a Passo)

### 1. Pré-requisitos
Certifique-se de ter instalado:
- [Node.js](https://nodejs.org/) (versão 18+)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

### 2. Configurando o Projeto Supabase

Você pode rodar localmente (via Docker) ou na nuvem (Supabase.com). Recomendamos a **Nuvem** para produção e testes reais de Webhook.

#### Opção A: Usando Supabase Cloud (Recomendado)
1. Crie uma conta e um projeto em [database.new](https://database.new).
2. Vá em **Project Settings > API** e copie:
   - Project URL
   - `anon` public key

#### Opção B: Rodando Localmente
1. Certifique-se que o Docker está rodando.
2. Inicie o Supabase:
   ```bash
   supabase start
   ```
3. Use as credenciais exibidas no terminal.

### 3. Configurando Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto. Use o modelo abaixo:

```env
# Frontend (Vite acessa estas variáveis)
VITE_SUPABASE_URL="Sua URL do Supabase"
VITE_SUPABASE_PUBLISHABLE_KEY="Sua chave anon/public"
VITE_SUPABASE_PROJECT_ID="O ID do seu projeto (ex: zinhopslmydjnabwzcxe)"

# Backend (Edge Functions acessam estas)
OPENROUTER_API_KEY="sk-or-v1-..."  # Sua chave da OpenRouter
OPENROUTER_MODEL="google/gemini-2.0-flash-lite-001"
```

> **Nota**: Se você estiver usando o Supabase na nuvem, as variáveis de backend (`OPENROUTER_...`) devem ser configuradas nos "Secrets" do projeto, e não apenas no `.env` local. Veja o passo 5.

### 4. Configurando o Banco de Dados (Migrations)

O projeto já possui todas as tabelas e regras necessárias na pasta `supabase/migrations`. Para aplicar no seu banco:

**Se estiver na Nuvem:**
1. Faça login no CLI:
   ```bash
   supabase login
   ```
2. Vincule seu projeto local ao remoto (pegue o Reference ID nas configs do projeto):
   ```bash
   supabase link --project-ref seu-project-id
   ```
3. Envie as migrações:
   ```bash
   supabase db push
   ```

**Se estiver Local:**
As migrações são aplicadas automaticamente com `supabase start`, ou você pode forçar com `supabase db reset`.

### 5. Deploy das Funções (Cérebro da IA e Webhook)

As funções que processam as mensagens ficam em `supabase/functions`.

1. **Configurar Segredos (Variáveis de Ambiente na Nuvem):**
   ```bash
   supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
   supabase secrets set OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001
   ```

2. **Fazer Deploy:**
   ```bash
   supabase functions deploy chat-crm
   supabase functions deploy webhook-whatsapp
   ```

### 6. Rodando o Frontend

Agora que o backend está pronto, inicie o site:

```bash
npm install
npm run dev
```
Acesse a URL mostrada (geralmente `http://localhost:8080`).

---

### Teste de Interface (Chat Web)

1. Vá até a página **Chat**.
2. Selecione uma conversa na lista à esquerda.
3. Observe as respostas da IA em tempo real.
4. Para intervir, digite no campo de mensagem e envie. Isso registrará a mensagem como se fosse um atendente humano ("Dino AI" para IA, "Você" para humano).

---

## 📂 Estrutura Importante

- `supabase/migrations/`: Arquivos SQL que criam o banco (Tabelas: leads, conversations, appointments, tags, etc).
- `supabase/functions/chat-crm/`: Lógica da IA, Prompt "Seu Dino" e regras de agendamento.
- `supabase/functions/webhook-whatsapp/`: Recebe os dados do WhatsApp e cria/atualiza leads.
- `src/pages/Chat.tsx`: Interface administrativa do Chat.
