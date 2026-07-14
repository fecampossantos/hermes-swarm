// Simple Hermes Gateway wrapper

const GATEWAY = 'http://localhost:8000/gateway';

export async function checkGateway() {
  try {
    await fetch(GATEWAY, { method: 'HEAD', cache: 'no-store' });
    return true;
  } catch {
    return false;
  }
}

export async function postToGateway(body) {
  const resp = await fetch(GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Gateway error ${resp.status}`);
  return resp.json();
}

export async function createBoss(name, model = 'default') {
  return postToGateway({ action: 'create_boss', data: { name, model } });
}

export async function createCharacter(name, soul, model = 'default') {
  return postToGateway({ action: 'create_character', data: { name, soul, model } });
}

export async functionirchenUpdateTask(task) {
  return postToGateway({ action: 'update_task', data: task });
}
