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

function getBaseWsUrl() {
  let base = gatewayConfig.url;
  let wsUrl = '';
  
  if (base.startsWith('http')) {
    wsUrl = base.replace(/^http/, 'ws');
  } else {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const cleanBase = base.startsWith('/') ? base : '/' + base;
    wsUrl = `${protocol}//${window.location.host}${cleanBase}`;
  }
  
  if (!wsUrl.endsWith('/ws')) {
    wsUrl = wsUrl.replace(/\/$/, '') + '/api/ws';
  }
  
  return wsUrl;
}

export async function checkGateway() {
  try {
    const baseUrl = gatewayConfig.url.replace(/\/ws$/, '');
    const headers = { "Content-Type": "application/json" };
    
    if (gatewayConfig.password && !gatewayConfig.username) {
      headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
    }
    
    // First, check if we already have a valid session/token
    const resp = await fetch(`${baseUrl}/v1/models`, { 
      headers, 
      cache: "no-store" 
    });
    
    if (!resp.redirected && resp.ok) {
      return true; // Connection is valid
    }
    
    // If it failed (unauthorized/redirected) and we have credentials, try to log in
    if (gatewayConfig.username && gatewayConfig.password) {
      const loginResp = await fetch(`${baseUrl}/auth/password-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: gatewayConfig.username,
          password: gatewayConfig.password,
          provider: "basic"
        }),
        credentials: "include"
      });
      
      const loginData = await loginResp.json().catch(() => ({}));
      
      if (loginResp.ok && loginData.ok) {
        return true;
      }
    }
    
    return false;
  } catch (e) {
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.sessionId;
    }
    
    let wsUrl = getBaseWsUrl();
    const baseUrl = gatewayConfig.url.replace(/\/ws$/, '');

    if (gatewayConfig.username && gatewayConfig.password) {
      // Request ticket using session cookie
      const ticketRes = await fetch(`${baseUrl}/api/auth/ws-ticket`, {
        method: "POST",
        credentials: "include"
      });
      if (!ticketRes.ok) {
        throw new Error("Authentication failed: Could not get WebSocket ticket.");
      }
      const ticketData = await ticketRes.json();
      wsUrl += `?ticket=${ticketData.ticket}`;
    } else if (gatewayConfig.password) {
      wsUrl += `?token=${encodeURIComponent(gatewayConfig.password)}`;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      
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
        
        const eventType = data.method === "event" ? data.params?.type : data.method;
        
        if (eventType === "message.delta") {
          const payload = data.method === "event" ? data.params?.payload : data.params;
          
          let chunk = "";
          if (payload?.delta !== undefined) {
            chunk = payload.delta;
          } else if (payload?.text !== undefined) {
            chunk = payload.text;
          } else if (payload?.content !== undefined) {
            chunk = payload.content;
          }
          
          if (chunk) {
            for (let handler of Object.values(this.streamHandlers)) {
              if (handler.onDelta) handler.onDelta(chunk);
            }
          }
        } else if (eventType === "message.complete") {
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
  let session = sessions[agentName];
  if (!session) {
    console.log(`Session not found in memory for agent: ${agentName}. Reconnecting...`);
    session = new GatewaySession();
    await session.connect();
    sessions[agentName] = session;
  }
  await session.submitPrompt(text, onDelta, onComplete);
}
