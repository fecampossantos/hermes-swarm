import { useState, useEffect } from 'react';
import { gatewayConfig } from '../gateway';

export function useKanbanState() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const poll = async () => {
      try {
        const baseUrl = gatewayConfig.url.replace(/\/ws$/, '');
        const headers = { "Content-Type": "application/json" };
        if (gatewayConfig.password) {
          headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
        }

        const res = await fetch(`${baseUrl}/kanban/list`, { 
          headers,
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.tasks) {
            setTasks(data.tasks);
          }
        }
      } catch (e) {
        console.error("Error polling kanban state:", e);
      }
    };

    const interval = setInterval(poll, 2000); // Polling kanban slightly less frequently
    poll();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [gatewayConfig.url]);

  return tasks;
}
