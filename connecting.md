2. Conectando o Browser ao GatewayComo o Hermes expõe uma interface OpenAI-compatible, você não precisa de bibliotecas proprietárias complexas. Pode usar o SDK padrão da OpenAI ou fetch nativo no JavaScript. Exemplo de conexão via fetch:JavaScriptasync function sendMessageToAgent(messages) {
   const response = await fetch('http://127.0.0.1:8642/v1/chat/completions', {
   method: 'POST',
   headers: {
   'Content-Type': 'application/json',
   'Authorization': `Bearer sua-chave-secreta`
   },
   body: JSON.stringify({
   model: "hermes-agent", // ou o modelo configurado
   messages: messages,
   stream: true // Recomendado para ver o progresso do agente em tempo real
   })
   });

// Processar Server-Sent Events (SSE) para streaming
const reader = response.body.getReader();
// ... lógica para ler chunks de texto
} 3. Orquestrando Agentes e SwarmsO Hermes não funciona apenas como um "chat wrapper", ele é um runtime completo de agentes. Para orquestrar um "swarm": Agentes Especializados: Em vez de tentar criar a lógica de swarm no seu front-end, defina os agentes dentro da configuração do Hermes ou via sistema de skills. API de Jobs: O Hermes expõe uma API /api/jobs para gerenciamento de tarefas cron e execução de longo prazo, ideal para orquestração de missões que exigem múltiplos passos. Runs API: Se o seu swarm for complexo, utilize o endpoint /v1/runs. Ele foi criado especificamente para cenários onde você quer criar uma "sessão de agente" (run) e se inscrever em eventos de progresso, em vez de gerenciar o estado da conversa manualmente no browser. 4. Dicas para o seu Dashboard (Front-end)Já que você está desenvolvendo no Termux, considere estas boas práticas para o seu dashboard:Visualização de Progresso: O Hermes envia eventos customizados hermes.tool.progress durante o streaming. Capture esses eventos para exibir ao usuário o que o agente está fazendo (ex: "Pesquisando na web...", "Escrevendo arquivo..."). Interface de Terminal: Como seu app roda no Termux, se precisar de um terminal interativo dentro do browser, lembre-se que o acesso a PTYs (pseudoterminais) via browser é limitado. Muitas interfaces de dashboard usam Xterm.js no front-end para simular essa experiência.Persistência: Como o Hermes mantém memória persistente em disco, você pode listar sessões anteriores através da API para que seu usuário possa retomar conversas de onde parou. Sugestão de próximo passo: Foque em implementar o endpoint /v1/runs. Ele é o mais adequado para o seu caso de uso, pois ele abstrai a complexidade do loop do agente e permite que seu browser apenas "assista" ao progresso do trabalho do swarm, em vez de enviar cada passo manualmente.

# Hermes Gateway Connection Guide

This guide explains how the `h3rmes` application connects to and communicates with the Hermes Gateway. You can use this reference to integrate the Gateway into your new agent swarm orchestration app.

## 1. Connection Configuration

The gateway requires a base URL (host) and authentication credentials.

- **Base URL normalization:** The host is formatted to include the correct protocol (`http://` or `https://`) and strips trailing slashes.
- **Authentication Methods:**
  - **API Key:** Passed via `Authorization: Bearer <apiKey>` header for HTTP requests, and as a `?token=<apiKey>` query parameter for WebSocket connections.
  - **Session Ticket:** If an authenticated user session exists, an HTTP POST to `/api/auth/ws-ticket` (with `credentials: 'include'`) is used to get a short-lived `ticket`, which is then passed as `?ticket=<ticket>` in the WebSocket URL.

## 2. HTTP REST Endpoints

For standard data retrieval like fetching available agent profiles, `fetch` requests are made.

### Fetching Agent Profiles

To discover available agents, models, or profiles, the app sequentially probes the following endpoints until one returns a successful `200 OK` response:

1. `GET /api/profiles`
2. `GET /api/agents`
3. `GET /api/models`

**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <apiKey>"
}
```

The app handles the response dynamically, expecting one of these formats:

- Raw array of objects: `[{ id: '...', name: '...' }]`
- Data wrapper: `{ "data": [...] }`
- Profiles wrapper: `{ "profiles": [...] }`
- Agents wrapper: `{ "agents": [...] }`

## 3. WebSocket Streaming (JSON-RPC 2.0)

For real-time interactions, streaming responses, and agent execution, a persistent WebSocket connection is established using the **JSON-RPC 2.0 protocol**.

**Endpoint:** `ws://<host>/api/ws` (or `wss://` for secure connections)  
_(Authentication query parameters `?token=` or `?ticket=` must be appended)._

### 3.1 Session Creation

If the client doesn't have an active session, it must create one immediately upon opening the WebSocket connection.

**Client Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "session.create",
  "params": {
    "cols": 80
  }
}
```

**Gateway Response:**

```json
{
  "id": 1,
  "result": {
    "session_id": "<new-session-id>"
  }
}
```

### 3.2 Submitting a Prompt

Once a `session_id` is acquired, the client submits the task or prompt:

**Client Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "prompt.submit",
  "params": {
    "session_id": "<session_id>",
    "text": "User's message or agent instruction here"
  }
}
```

### 3.3 Handling Streamed Events

The gateway streams responses asynchronously by sending JSON-RPC payloads where the `method` indicates the event type. The app listens for these to update the UI stream.

**Delta Event (Partial chunk of text):**

```json
{
  "method": "message.delta",
  "params": {
    "delta": " chunk text "
  }
}
```

> [!NOTE]
> Depending on the gateway version, delta events might also arrive as `method: "event"` with `params.type === "message.delta"` and the text payload inside `params.payload.delta`. The `h3rmes` app parses both structures to be safe.

**Complete Event (Finished streaming):**

```json
{
  "method": "message.complete"
}
```

## Tips for the Swarm Orchestration App

When building your swarm orchestration app based on this gateway:

1. **Manage Sessions Carefully:** If you have multiple agents in the swarm, you may need to manage and track multiple `session_id`s simultaneously.
2. **WebSocket Stability:** Ensure you implement reconnection logic or error handling for the WebSockets, clearing the `session_id` if a `session not found` error occurs.
3. **JSON-RPC Compliance:** The gateway is strictly expecting JSON-RPC 2.0 format strings (`jsonrpc`, `id`, `method`, `params`).
