import { useEffect, useState } from 'react';

export default function RiskHeatmap({ heatmapData }) {
  const [heatmap, setHeatmap] = useState({});
  
  const categories = ['technical', 'timeline', 'resource', 'business'];
  const severities = ['low', 'medium', 'high', 'critical'];
  
  const severityColors = {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#ff5722',
    critical: '#d32f2f'
  };

  useEffect(() => {
    if (heatmapData && typeof heatmapData === 'object') {
      setHeatmap(heatmapData);
    }
  }, [heatmapData]);

  const getCellValue = (category, severity) => {
    return heatmap[category]?.[severity] || 0;
  };

  const getMaxValue = () => {
    let max = 0;
    categories.forEach(cat => {
      severities.forEach(sev => {
        const val = getCellValue(cat, sev);
        if (val > max) max = val;
      });
    });
    return max || 1;
  };

  const getOpacity = (value) => {
    const max = getMaxValue();
    return value === 0 ? 0.1 : 0.3 + (value / max) * 0.7;
  };

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #333'
    }}>
      <h3 style={{ color: '#10a37f', marginBottom: '16px', fontSize: '18px' }}>
        🔥 Risk Heatmap
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '4px'
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: '#ccc',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Category
              </th>
              {severities.map(severity => (
                <th key={severity} style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: '#ccc',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {severity}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category}>
                <td style={{
                  padding: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '500',
                  textTransform: 'capitalize',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '4px'
                }}>
                  {category}
                </td>
                {severities.map(severity => {
                  const value = getCellValue(category, severity);
                  const opacity = getOpacity(value);
                  
                  return (
                    <td key={severity} style={{
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: severityColors[severity],
                      opacity: opacity,
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      cursor: value > 0 ? 'pointer' : 'default',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (value > 0) e.target.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = opacity;
                    }}
                    title={value > 0 ? `${value} ${severity} ${category} risk(s)` : 'No risks'}
                    >
                      {value || '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#2a2a2a',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#999'
      }}>
        <strong style={{ color: '#ccc' }}>Legend:</strong> Higher opacity = More risks detected. Hover over cells for details.
      </div>
    </div>
  );
}
