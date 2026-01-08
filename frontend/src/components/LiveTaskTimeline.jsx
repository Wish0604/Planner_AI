import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

export default function LiveTaskTimeline({ data }) {
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    if (!data || !Array.isArray(data)) return;

    // Group events by minute for timeline visualization
    const grouped = {};
    
    data.forEach(event => {
      if (event.type !== 'task_progress') return;
      
      const time = new Date(event.timestamp);
      const minute = new Date(Math.floor(time.getTime() / 60000) * 60000);
      const timeKey = minute.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          time: timeKey,
          tasks: {},
          totalProgress: 0,
          count: 0
        };
      }
      
      grouped[timeKey].tasks[event.taskName] = event.progress;
      grouped[timeKey].totalProgress += event.progress;
      grouped[timeKey].count++;
    });

    const chartData = Object.values(grouped).map(entry => ({
      time: entry.time,
      averageProgress: entry.count > 0 ? entry.totalProgress / entry.count : 0,
      activeTasks: entry.count
    })).slice(-20); // Last 20 time points

    setTimelineData(chartData);
  }, [data]);

  if (!timelineData.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p>📊 Waiting for task data...</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Start a project analysis to see live task progress</p>
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
        📈 Live Task Timeline
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={timelineData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="time" 
            stroke="#999" 
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#999" 
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff'
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#ccc' }}
          />
          <Line 
            type="monotone" 
            dataKey="averageProgress" 
            stroke="#10a37f" 
            strokeWidth={2}
            name="Avg Progress (%)"
            dot={{ fill: '#10a37f', r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="activeTasks" 
            stroke="#64b5f6" 
            strokeWidth={2}
            name="Active Tasks"
            dot={{ fill: '#64b5f6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
