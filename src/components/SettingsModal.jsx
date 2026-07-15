import React, { useState } from 'react';
import { checkGateway, setGatewayConfig } from '../gateway';

/**
 * Modal to configure Hermes Gateway connection.
 * @param {Object} props
 * @param {Object} props.currentConfig - The current configuration object
 * @param {Function} props.onSave - Callback when config is saved
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function SettingsModal({ currentConfig, onSave, onClose }) {
  const [url, setUrl] = useState(currentConfig.url || "");
  const [username, setUsername] = useState(currentConfig.username || "");
  const [password, setPassword] = useState(currentConfig.password || "");

  const [testStatus, setTestStatus] = useState('idle');

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ url, username, password });
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    setTestStatus('testing');
    try {
      // Temporarily set the config to test it
      setGatewayConfig({ url, username, password });
      const ok = await checkGateway();
      
      if (ok) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    } catch {
      setTestStatus('failed');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gateway Settings</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '16px' }}>
            Configure the connection to your Hermes Gateway instance.
          </p>
          <form onSubmit={handleSave}>
            <div className="input-group">
              <label>Gateway URL</label>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="Leave empty to use proxy, or enter full URL" 
              />
            </div>
            
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Leave blank for token auth" 
              />
            </div>
            
            <div className="input-group">
              <label>Password (or API Token)</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password or API Token" 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ 
                  background: testStatus === 'success' ? '#22c55e' : testStatus === 'failed' ? '#ef4444' : 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid var(--border-glass)',
                  flex: 1
                }}
                onClick={handleTestConnection}
              >
                {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? '✅ Connected' : testStatus === 'failed' ? '❌ Failed' : 'Test Connection'}
              </button>
              <button type="submit" className="btn" style={{ flex: 2 }}>
                Save & Connect
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
