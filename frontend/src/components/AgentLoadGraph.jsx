import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

export default function AgentLoadGraph({ agentMetrics }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!agentMetrics || !Array.isArray(agentMetrics)) return;

    const data = agentMetrics.map(agent => ({
      name: agent.name.replace(' Specialist', ''),
      current: agent.currentLoad || 0,
      completed: agent.tasksCompleted || 0,
      failed: agent.tasksFailed || 0,
      avgTime: agent.averageTaskTime ? Math.round(agent.averageTaskTime / 1000) : 0 // Convert to seconds
    }));

    setChartData(data);
  }, [agentMetrics]);

  const getLoadStatus = (load) => {
    if (load === 0) return { text: 'Idle', color: '#999' };
    if (load <= 2) return { text: 'Normal', color: '#4caf50' };
    if (load <= 5) return { text: 'Busy', color: '#ff9800' };
    return { text: 'Overloaded', color: '#f44336' };
  };

  if (!chartData.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p>🤖 No agent activity yet</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Agents will appear here when processing tasks</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #333'
    }}>
      <h3 style={{ color: '#10a37f', marginBottom: '16px', fontSize: '18px' }}>
        🤖 Agent Load & Performance
      </h3>
      
      {/* Current load indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {agentMetrics.map(agent => {
          const status = getLoadStatus(agent.currentLoad);
          return (
            <div key={agent.name} style={{
              backgroundColor: '#2a2a2a',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: `4px solid ${status.color}`
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>
                Status: <span style={{ color: status.color, fontWeight: '600' }}>{status.text}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Load: {agent.currentLoad} | Done: {agent.tasksCompleted} | Failed: {agent.tasksFailed}
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="name" 
            stroke="#999" 
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#999" 
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff'
            }}
            formatter={(value, name) => {
              if (name === 'avgTime') return [`${value}s`, 'Avg Time'];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#ccc' }}
          />
          <Bar dataKey="current" fill="#64b5f6" name="Current Load" />
          <Bar dataKey="completed" fill="#4caf50" name="Completed" />
          <Bar dataKey="failed" fill="#f44336" name="Failed" />
        </BarChart>
      </ResponsiveContainer>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#2a2a2a',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#999'
      }}>
        <strong style={{ color: '#ccc' }}>Performance Metrics:</strong> Current Load shows active tasks. 
        Overloaded agents (&gt;5 tasks) may need load balancing.
      </div>
    </div>
  );
}
