import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveTaskTimeline from '../components/LiveTaskTimeline.jsx';
import RiskHeatmap from '../components/RiskHeatmap.jsx';
import AgentLoadGraph from '../components/AgentLoadGraph.jsx';
import ReallocationEventStream from '../components/ReallocationEventStream.jsx';

export default function TelemetryDashboard() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || window.location.origin;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Fetch initial metrics
    fetchMetrics();

    // Connect to SSE stream for real-time updates
    const eventSource = new EventSource(`${apiBase}/api/telemetry/stream`);

    eventSource.onopen = () => {
      console.log('✅ Connected to telemetry stream');
      setConnected(true);
      setError('');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'snapshot') {
          setMetrics(message.data);
          setLoading(false);
        } else if (message.type === 'event') {
          // Update metrics with new event
          setMetrics(prev => {
            if (!prev) return prev;
            
            const newMetrics = { ...prev };
            newMetrics.recentEvents = [...(prev.recentEvents || []), message.data].slice(-50);
            
            // Update task timeline
            if (message.data.type === 'task_progress') {
              newMetrics.taskTimeline = [...(prev.taskTimeline || []), message.data].slice(-100);
            }
            
            // Update risk events
            if (message.data.type === 'risk_event') {
              newMetrics.riskEvents = [...(prev.riskEvents || []), message.data].slice(-50);
            }
            
            // Update reallocation events
            if (message.data.type === 'reallocation') {
              newMetrics.reallocationEvents = [...(prev.reallocationEvents || []), message.data].slice(-20);
            }
            
            // Update agent metrics
            if (['agent_start', 'agent_complete', 'agent_error'].includes(message.data.type)) {
              // Refetch metrics to get updated agent stats
              fetchMetrics();
            }
            
            return newMetrics;
          });
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE connection error:', err);
      setConnected(false);
      setError('Connection lost. Reconnecting...');
      eventSource.close();
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${apiBase}/api/telemetry/metrics`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data.metrics);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRiskHeatmap = async () => {
    try {
      const res = await fetch(`${apiBase}/api/telemetry/risk-heatmap`);
      if (!res.ok) throw new Error('Failed to fetch risk heatmap');
      const data = await res.json();
      return data.heatmap;
    } catch (err) {
      console.error('Error fetching risk heatmap:', err);
      return {};
    }
  };

  useEffect(() => {
    if (metrics) {
      fetchRiskHeatmap().then(heatmap => {
        setMetrics(prev => ({ ...prev, riskHeatmap: heatmap }));
      });
    }
  }, [metrics?.riskEvents]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0f0f10',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading Telemetry Dashboard...</div>
          <div style={{ fontSize: '14px', color: '#999' }}>Connecting to real-time stream</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f10',
      color: '#fff',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
            📊 Real-Time Telemetry Dashboard
          </h1>
          <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '14px' }}>
            Live monitoring of multi-agent system performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: connected ? '#1a2a1b' : '#2a1a1b',
            borderRadius: '6px',
            border: `1px solid ${connected ? '#2a4a2b' : '#4a2a2b'}`,
            fontSize: '13px',
            color: connected ? '#4caf50' : '#f44336'
          }}>
            {connected ? '● Connected' : '○ Disconnected'}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10a37f',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            ← Back to Projects
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#2a1a1b',
          border: '1px solid #4a2a2b',
          borderRadius: '8px',
          color: '#f44336',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Metrics Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Tasks Completed</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#4caf50' }}>
            {metrics?.totalTasksCompleted || 0}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Tasks In Progress</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#64b5f6' }}>
            {metrics?.totalTasksInProgress || 0}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Tasks Failed</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f44336' }}>
            {metrics?.totalTasksFailed || 0}
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Active Agents</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10a37f' }}>
            {metrics?.agentMetrics?.filter(a => a.currentLoad > 0).length || 0}
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <LiveTaskTimeline data={metrics?.taskTimeline} />
        <AgentLoadGraph agentMetrics={metrics?.agentMetrics} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '20px'
      }}>
        <RiskHeatmap heatmapData={metrics?.riskHeatmap} />
        <ReallocationEventStream events={metrics?.recentEvents} />
      </div>
    </div>
  );
}
