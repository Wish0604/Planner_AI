import { useEffect, useRef, useState } from 'react';

export default function ReallocationEventStream({ events }) {
  const [filteredEvents, setFilteredEvents] = useState([]);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!events || !Array.isArray(events)) return;

    // Show only relevant event types
    const relevant = events.filter(e => 
      ['reallocation', 'agent_start', 'agent_complete', 'agent_error', 'risk_event'].includes(e.type)
    ).slice(-50); // Last 50 events

    setFilteredEvents(relevant);

    // Auto-scroll to bottom
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'reallocation': return '🔄';
      case 'agent_start': return '▶️';
      case 'agent_complete': return '✅';
      case 'agent_error': return '❌';
      case 'risk_event': return '⚠️';
      default: return '📝';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'reallocation': return '#64b5f6';
      case 'agent_start': return '#10a37f';
      case 'agent_complete': return '#4caf50';
      case 'agent_error': return '#f44336';
      case 'risk_event': return '#ff9800';
      default: return '#ccc';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const renderEventDetails = (event) => {
    switch (event.type) {
      case 'reallocation':
        return (
          <span>
            Task <strong>{event.taskName}</strong> reallocated from{' '}
            <strong style={{ color: '#ff9800' }}>{event.fromAgent}</strong> to{' '}
            <strong style={{ color: '#10a37f' }}>{event.toAgent}</strong>
            {event.reason && <span style={{ color: '#999' }}> ({event.reason})</span>}
          </span>
        );
      
      case 'agent_start':
        return (
          <span>
            <strong style={{ color: '#64b5f6' }}>{event.agentName}</strong> started task{' '}
            <strong>{event.taskName}</strong>
          </span>
        );
      
      case 'agent_complete':
        return (
          <span>
            <strong style={{ color: '#4caf50' }}>{event.agentName}</strong> completed{' '}
            <strong>{event.taskName}</strong>
            {event.duration && (
              <span style={{ color: '#999' }}> in {Math.round(event.duration / 1000)}s</span>
            )}
          </span>
        );
      
      case 'agent_error':
        return (
          <span>
            <strong style={{ color: '#f44336' }}>{event.agentName}</strong> failed on{' '}
            <strong>{event.taskName}</strong>
            {event.error && <span style={{ color: '#ff6b6b' }}> - {event.error}</span>}
          </span>
        );
      
      case 'risk_event':
        return (
          <span>
            Risk identified: <strong style={{ color: getSeverityColor(event.severity) }}>
              {event.riskName}
            </strong>
            <span style={{ color: '#999' }}> ({event.severity} / {event.category})</span>
          </span>
        );
      
      default:
        return <span>Event: {event.type}</span>;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#d32f2f';
      case 'high': return '#ff5722';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#ccc';
    }
  };

  if (!filteredEvents.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <p>📡 Event stream is quiet</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Real-time events will appear here</p>
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ color: '#10a37f', fontSize: '18px', margin: 0 }}>
          📡 Live Event Stream
        </h3>
        <div style={{
          fontSize: '12px',
          color: '#10a37f',
          padding: '4px 12px',
          backgroundColor: '#1a2a1b',
          borderRadius: '12px',
          border: '1px solid #2a4a2b'
        }}>
          ● LIVE
        </div>
      </div>
      
      <div 
        ref={streamRef}
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          backgroundColor: '#0f0f10',
          borderRadius: '6px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}
      >
        {filteredEvents.map((event, idx) => (
          <div
            key={event.id || idx}
            style={{
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: '#1a1a1a',
              borderLeft: `3px solid ${getEventColor(event.type)}`,
              borderRadius: '4px',
              color: '#e5e5e5',
              lineHeight: '1.6',
              animation: idx === filteredEvents.length - 1 ? 'fadeIn 0.3s ease-in' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>
                <span style={{ marginRight: '8px' }}>{getEventIcon(event.type)}</span>
                {renderEventDetails(event)}
              </span>
              <span style={{ color: '#666', fontSize: '11px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {formatTime(event.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
