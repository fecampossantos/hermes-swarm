// Hermes Gateway wrapper with configurable connection

let gatewayConfig = {
  url: "http://localhost:8000/gateway",
  username: "",
  password: ""
};

export function setGatewayConfig(config) {
  gatewayConfig = { ...gatewayConfig, ...config };
}

export function getGatewayConfig() {
  return gatewayConfig;
}

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (gatewayConfig.username && gatewayConfig.password) {
    headers["Authorization"] = "Basic " + btoa(`${gatewayConfig.username}:${gatewayConfig.password}`);
  }
  return headers;
}

export async function checkGateway() {
  try {
    const headers = getHeaders();
    // For a simple GET, we don't necessarily need Content-Type, which might avoid a preflight
    // if there's no Authorization header. 
    delete headers["Content-Type"];
    
    const resp = await fetch(gatewayConfig.url, { 
      method: "GET",
      cache: "no-store",
      headers: headers
    });
    return resp.ok || resp.status === 405 || resp.status === 404;
  } catch {
    return false;
  }
}

export async function postToGateway(body) {
  const resp = await fetch(gatewayConfig.url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Gateway error ${resp.status}`);
  return resp.json();
}

export async function createBoss(name, model = "default") {
  return postToGateway({ action: "create_boss", data: { name, model } });
}

export async function createCharacter(name, soul, model = "default") {
  return postToGateway({
    action: "create_character",
    data: { name, soul, model },
  });
}

export async function updateTask(task) {
  return postToGateway({ action: "update_task", data: task });
}
