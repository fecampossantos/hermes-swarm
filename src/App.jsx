import React, { useState, useEffect } from "react";
import OfficeScene from "./components/OfficeScene";
import AgentModal from "./components/AgentModal";
import CreateAgentForm from "./components/CreateAgentForm";
import CommunicationLog from "./components/CommunicationLog";
import SettingsModal from "./components/SettingsModal";
import { setGatewayConfig, checkGateway, sendMessageToAgent } from "./gateway";

export default function App() {
  const [boss, setBoss] = useState(null);
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Connection and settings state
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gatewayConfigState, setGatewayConfigState] = useState({
    url: "/api",
    username: "",
    password: ""
  });

  // Load persisted state on mount
  useEffect(() => {
    let loadedConfig = gatewayConfigState;
    const stored = localStorage.getItem("hermes-swarm-state");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.boss) setBoss(data.boss);
        if (data.agents) setAgents(data.agents);
        if (data.logs) setLogs(data.logs);
        if (data.config) {
          loadedConfig = data.config;
          setGatewayConfigState(data.config);
        }
      } catch (e) {
        console.error("Failed to parse stored state");
      }
    }
    
    // Apply config and check connection
    setGatewayConfig(loadedConfig);
    verifyConnection();
    
    // Periodically check connection
    const interval = setInterval(verifyConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const verifyConnection = async () => {
    const connected = await checkGateway();
    setIsConnected(connected);
    // If not connected and we have never shown settings, we could pop it up. 
    // But it's better to let the user click the connection indicator if they want.
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("hermes-swarm-state", JSON.stringify({ 
      boss, 
      agents, 
      logs,
      config: gatewayConfigState 
    }));
  }, [boss, agents, logs, gatewayConfigState]);

  const handleSaveSettings = async (newConfig) => {
    setGatewayConfigState(newConfig);
    setGatewayConfig(newConfig);
    setShowSettings(false);
    
    // Immediately check connection with new config
    const connected = await checkGateway();
    setIsConnected(connected);
  };

  const handleBossCreated = (newBoss) => {
    setBoss(newBoss);
    setLogs(prev => [...prev, { sender: 'system', text: `Boss ${newBoss.name} has entered the office.` }]);
  };

  const handleAgentCreated = (newAgent) => {
    setAgents(prev => [...prev, newAgent]);
    setLogs(prev => [...prev, { sender: 'boss', text: `Welcome to the team, ${newAgent.name}.` }]);
  };

  const handleDeleteAgent = (agentToDelete) => {
    if (agentToDelete.role === 'boss') {
      setBoss(null);
      setAgents([]);
      setLogs(prev => [...prev, { sender: 'system', text: `Boss ${agentToDelete.name} has been removed. All agents dismissed.` }]);
    } else {
      setAgents(prev => prev.filter(a => a.name !== agentToDelete.name));
      setLogs(prev => [...prev, { sender: 'boss', text: `Agent ${agentToDelete.name} has been removed from the team.` }]);
    }
    setSelectedAgent(null);
  };

  const handleSendMessage = async (text) => {
    // Add user message with a unique ID so we can append to the reply
    const msgId = Date.now();
    setLogs(prev => [...prev, { id: msgId, sender: 'user', text }]);
    
    const targetAgent = selectedAgent ? selectedAgent.name : (boss ? boss.name : null);
    
    if (!targetAgent) {
      setLogs(prev => [...prev, { id: msgId + 1, sender: 'system', text: "No agent selected." }]);
      return;
    }

    // Create a placeholder for the agent's reply
    const replyId = msgId + 1;
    setLogs(prev => [...prev, { id: replyId, sender: targetAgent, text: "" }]);
    
    // Update status to 'thinking'
    setAgents(prev => prev.map(a => a.name === targetAgent ? { ...a, status: 'thinking' } : a));
    if (boss && targetAgent === boss.name) {
      setBoss(prev => ({ ...prev, status: 'thinking' }));
    }

    try {
      await sendMessageToAgent(targetAgent, text, 
        // onDelta: Stream the text as it arrives
        (chunk) => {
          setLogs(prev => prev.map(log => 
            log.id === replyId ? { ...log, text: log.text + chunk } : log
          ));
        },
        // onComplete: Finish thinking state
        () => {
          setAgents(prev => prev.map(a => a.name === targetAgent ? { ...a, status: 'idle' } : a));
          if (boss && targetAgent === boss.name) {
            setBoss(prev => ({ ...prev, status: 'idle' }));
          }
        }
      );
    } catch (e) {
      console.error(e);
      setLogs(prev => prev.map(log => 
        log.id === replyId ? { ...log, text: log.text + "\n[Error connecting to agent session]" } : log
      ));
      setAgents(prev => prev.map(a => a.name === targetAgent ? { ...a, status: 'idle' } : a));
      if (boss && targetAgent === boss.name) {
        setBoss(prev => ({ ...prev, status: 'idle' }));
      }
    }
  };

  return (
    <div className="app-container">
      {/* Visual Scene Area */}
      <OfficeScene 
        agents={agents} 
        boss={boss} 
        onAgentClick={setSelectedAgent} 
      />

      {/* Orchestration Sidebar */}
      <div className="sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: 0 }}>Hermes Swarm</h1>
          
          {/* Connection Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onClick={() => setShowSettings(true)}
            title="Click to configure Gateway"
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isConnected ? '#22c55e' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
            }}></div>
            <span style={{ color: 'var(--text-muted)' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <CreateAgentForm 
          hasBoss={!!boss} 
          onBossCreated={handleBossCreated}
          onAgentCreated={handleAgentCreated}
        />
        
        <CommunicationLog 
          hasBoss={!!boss}
          logs={logs}
          onSendMessage={handleSendMessage}
        />
      </div>
      
      {/* Overlay Modals */}
      <AgentModal 
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
        onDelete={handleDeleteAgent}
      />
      
      {showSettings && (
        <SettingsModal 
          currentConfig={gatewayConfigState}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
