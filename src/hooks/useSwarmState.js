import { useState, useEffect } from 'react';
import { gatewayConfig } from '../gateway';

export function useSwarmState() {
  const [swarm, setSwarm] = useState([]);

  useEffect(() => {
    let isMounted = true;
    
    const poll = async () => {
      try {
        const baseUrl = gatewayConfig.url.replace(/\/ws$/, '');
        const headers = { "Content-Type": "application/json" };
        if (gatewayConfig.password) {
          headers["Authorization"] = `Bearer ${gatewayConfig.password}`;
        }

        const res = await fetch(`${baseUrl}/sessions`, { 
          headers,
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.sessions) {
            setSwarm(data.sessions);
          }
        }
      } catch (e) {
        console.error("Error polling swarm state:", e);
      }
    };

    const interval = setInterval(poll, 1000);
    poll();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [gatewayConfig.url]); // re-run if URL changes

  return swarm;
}
