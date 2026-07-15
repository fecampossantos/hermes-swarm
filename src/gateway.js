// Hermes Gateway wrapper using JSON-RPC 2.0 WebSockets

let gatewayConfig = {
  url: "/api",
  username: "",
  password: "" // Used for API Key
};

export function setGatewayConfig(config) {
  gatewayConfig = { ...gatewayConfig, ...config };
}

export function getGatewayConfig() {
  return gatewayConfig;
}

function getWsUrl() {
  let base = gatewayConfig.url;
  let wsUrl = '';
  
  if (base.startsWith('http')) {
    wsUrl = base.replace(/^http/, 'ws');
  } else {
    // Relative path, use window.location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const cleanBase = base.startsWith('/') ? base : '/' + base;
    wsUrl = `${protocol}//${window.location.host}${cleanBase}`;
  }
  
  if (!wsUrl.endsWith('/ws')) {
    wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
  }
  
  if (gatewayConfig.password) {
    wsUrl += `?token=${encodeURIComponent(gatewayConfig.password)}`;
  }
  
  return wsUrl;
}

export async function checkGateway() {
  try {
    const headers = { "Content-Type": "application/json" };
    if (gatewayConfig.password) {
      headers["Authorization"] = "Bearer " + gatewayConfig.password;
    }
    
    const baseUrl = gatewayConfig.url.replace(/\/ws$/, '');
    const endpoints = ['/profiles', '/agents', '/models'];
    
    for (const ep of endpoints) {
      try {
        const resp = await fetch(`${baseUrl}${ep}`, { headers, cache: "no-store" });
        if (resp.ok) return true;
      } catch (e) {
        // ignore and try next
      }
    }
    return false;
  } catch {
    return false;
  }
}

export class GatewaySession {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.messageId = 1;
    this.callbacks = {};
    this.streamHandlers = {};
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return resolve(this.sessionId);
      }
      
      this.ws = new WebSocket(getWsUrl());
      
      this.ws.onopen = () => {
        this.sendRequest("session.create", { cols: 80 })
          .then(res => {
            this.sessionId = res.session_id;
            resolve(this.sessionId);
          })
          .catch(reject);
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.id && this.callbacks[data.id]) {
          if (data.error) {
            this.callbacks[data.id].reject(data.error);
          } else {
            this.callbacks[data.id].resolve(data.result);
          }
          delete this.callbacks[data.id];
          return;
        }
        
        if (data.method === "message.delta" || (data.method === "event" && data.params?.type === "message.delta")) {
          let chunk = data.method === "message.delta" ? data.params.delta : data.params.payload?.delta;
          for (let handler of Object.values(this.streamHandlers)) {
            if (handler.onDelta) handler.onDelta(chunk);
          }
        } else if (data.method === "message.complete") {
          for (let handler of Object.values(this.streamHandlers)) {
            if (handler.onComplete) handler.onComplete();
          }
        }
      };
      
      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        reject(err);
      };
      
      this.ws.onclose = () => {
        this.ws = null;
        this.sessionId = null;
      };
    });
  }
  
  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.callbacks[id] = { resolve, reject };
      this.ws.send(JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params
      }));
    });
  }
  
  async submitPrompt(text, onDelta, onComplete) {
    if (!this.sessionId) await this.connect();
    
    const handlerId = Date.now().toString();
    this.streamHandlers[handlerId] = { onDelta, onComplete };
    
    const originalOnComplete = onComplete;
    this.streamHandlers[handlerId].onComplete = () => {
      delete this.streamHandlers[handlerId];
      if (originalOnComplete) originalOnComplete();
    };

    try {
      await this.sendRequest("prompt.submit", {
        session_id: this.sessionId,
        text
      });
    } catch (e) {
      console.error("Submit prompt failed", e);
      if (this.streamHandlers[handlerId]) {
          this.streamHandlers[handlerId].onComplete();
      }
    }
  }
  
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Map agent names to their respective sessions
const sessions = {};

export async function createBoss(name) {
  const session = new GatewaySession();
  await session.connect();
  sessions[name] = session;
  return new Promise((resolve) => {
    session.submitPrompt(
      `/create-boss name="${name}"`, 
      () => {}, 
      () => resolve(session)
    );
  });
}

export async function createCharacter(name, soul) {
  const session = new GatewaySession();
  await session.connect();
  sessions[name] = session;
  return new Promise((resolve) => {
    session.submitPrompt(
      `Adopt this persona: ${soul}`, 
      () => {}, 
      () => resolve(session)
    );
  });
}

export async function sendMessageToAgent(agentName, text, onDelta, onComplete) {
  const session = sessions[agentName];
  if (!session) {
    throw new Error(`Session not found for agent: ${agentName}`);
  }
  await session.submitPrompt(text, onDelta, onComplete);
}
