// Hermes Gateway REST API wrapper

export let gatewayConfig = {
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

export async function checkGateway() {
  try {
    const url = gatewayConfig.url || "";
    const isProxy = url === "/api" || url === "";
    const baseUrl = isProxy ? "" : url.replace(/\/ws$/, '');
    const headers = { "Content-Type": "application/json" };
    
    if (gatewayConfig.password && !gatewayConfig.username) {
      headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
    }
    
    // First, check if we already have a valid session/token
    const resp = await fetch(`${baseUrl}/api/sessions`, { 
      headers, 
      cache: "no-store",
      credentials: "include"
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

// Kanban API
export async function dispatchTask(taskText, assign) {
  const url = gatewayConfig.url || "";
  const isProxy = url === "/api" || url === "";
  const baseUrl = isProxy ? "" : url.replace(/\/ws$/, '');
  const headers = { "Content-Type": "application/json" };
  if (gatewayConfig.password && !gatewayConfig.username) {
    headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
  }

  const res = await fetch(`${baseUrl}/api/kanban/create`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ task: taskText, assign })
  });

  if (!res.ok) {
    throw new Error(`Failed to dispatch task: ${res.status}`);
  }
  return await res.json();
}

export async function fetchSessionHistory(sessionKey) {
  const url = gatewayConfig.url || "";
  const isProxy = url === "/api" || url === "";
  const baseUrl = isProxy ? "" : url.replace(/\/ws$/, '');
  const headers = { "Content-Type": "application/json" };
  if (gatewayConfig.password && !gatewayConfig.username) {
    headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
  }

  const res = await fetch(`${baseUrl}/api/session-history?key=${encodeURIComponent(sessionKey)}`, {
    headers,
    credentials: 'include'
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}
