// Component to render structured JSON output from agents
import React, { useState } from "react";

function renderTextWithLinks(text) {
  if (typeof text !== "string") return text;
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#4fc3f7', textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function RoadmapRenderer({ data }) {
  if (!data || data.parseError || typeof data !== 'object') {
    return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e5e5e5' }}>{(data && (data.raw || JSON.stringify(data, null, 2))) || 'No data'}</pre>;
  }

  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  const resourceAllocation = Array.isArray(data.resourceAllocation)
    ? data.resourceAllocation
    : (data.resourceAllocation && typeof data.resourceAllocation === 'object'
        ? Object.entries(data.resourceAllocation).map(([role, val]) => ({
            role,
            count: typeof val === 'number' ? val : 1,
            allocation: '100%'
          }))
        : []);
  const risks = Array.isArray(data.risks) ? data.risks : [];

  return (
    <div style={{ color: '#e5e5e5' }}>
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>📊 Project Overview</h3>
        <div style={{ backgroundColor: '#1a1a1b', padding: '20px', borderRadius: '8px', border: '1px solid #3a3a3b' }}>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Name:</strong> {renderTextWithLinks(data.projectOverview?.name)}</p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Description:</strong> {renderTextWithLinks(data.projectOverview?.description)}</p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Duration:</strong> {renderTextWithLinks(data.projectOverview?.estimatedDuration)}</p>
          <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Team Size:</strong> {renderTextWithLinks(data.projectOverview?.teamSize)}</p>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>🎯 Milestones</h3>
        {milestones.map((milestone, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1a1b', 
            padding: '20px', 
            marginBottom: '12px', 
            borderRadius: '8px',
            border: '1px solid #3a3a3b',
            transition: 'all 0.2s'
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#10a37f' }}>{renderTextWithLinks(`${milestone.id}: ${milestone.name}`)}</h4>
            <p style={{ marginBottom: '8px', lineHeight: '1.6' }}><strong style={{ color: '#ccc' }}>Duration:</strong> <span style={{ color: '#e5e5e5' }}>{renderTextWithLinks(milestone.duration)}</span></p>
            <p style={{ marginBottom: '12px', lineHeight: '1.6', color: '#ccc' }}>{renderTextWithLinks(milestone.description)}</p>
            <p style={{ marginBottom: '8px', fontWeight: '600', color: '#fff' }}>Deliverables:</p>
            <ul style={{ marginBottom: '0', marginLeft: '20px', color: '#ccc' }}>
              {milestone.deliverables?.map((d, i) => <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5' }}>{renderTextWithLinks(d)}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>👥 Resource Allocation</h3>
        {resourceAllocation.map((resource, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1a1b', 
            padding: '14px 20px', 
            marginBottom: '8px', 
            borderRadius: '8px',
            border: '1px solid #3a3a3b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <strong style={{ color: '#10a37f' }}>{resource.role}</strong>
            <span style={{ color: '#ccc' }}>{resource.count} person{resource.count > 1 ? 's' : ''} ({resource.allocation})</span>
          </div>
        ))}
      </section>

      <section>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>⚠️ Key Risks</h3>
        {risks.map((risk, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#2a2416', 
            padding: '16px', 
            marginBottom: '10px', 
            borderRadius: '8px',
            border: '1px solid #4a3a1b',
            borderLeft: '4px solid #ff9800'
          }}>
            <strong style={{ color: '#ffb74d' }}>{renderTextWithLinks(risk.name)}</strong> <span style={{ color: '#999', fontSize: '13px' }}>({risk.severity})</span>
            <p style={{ marginTop: '8px', marginBottom: '0', color: '#ccc', lineHeight: '1.6' }}>💡 <strong>Mitigation:</strong> {renderTextWithLinks(risk.mitigation)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function TechStackRenderer({ data }) {
  if (!data || data.parseError) {
    return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e5e5e5' }}>{data?.raw || 'No data'}</pre>;
  }

  return (
    <div style={{ color: '#e5e5e5' }}>
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>🎨 Frontend</h3>
        <div style={{ backgroundColor: '#1a1a1b', padding: '20px', borderRadius: '8px', border: '1px solid #3a3a3b' }}>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Framework:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.frontend?.framework)} (v{renderTextWithLinks(data.frontend?.version)})</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>UI Libraries:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks((data.frontend?.uiLibraries || []).join(', '))}</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>State Management:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.frontend?.stateManagement)}</span></p>
          <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Build Tools:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks((data.frontend?.buildTools || []).join(', '))}</span></p>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>⚙️ Backend</h3>
        <div style={{ backgroundColor: '#1a1a1b', padding: '20px', borderRadius: '8px', border: '1px solid #3a3a3b' }}>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Runtime:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.backend?.runtime)}</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Framework:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.backend?.framework)}</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Database:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.backend?.database)}</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>API Architecture:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.backend?.apiArchitecture)}</span></p>
          <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Authentication:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.backend?.authentication)}</span></p>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>🚀 DevOps</h3>
        <div style={{ backgroundColor: '#1a1a1b', padding: '20px', borderRadius: '8px', border: '1px solid #3a3a3b' }}>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Hosting:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.devops?.hosting)}</span></p>
          <p style={{ marginBottom: '12px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>CI/CD:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks((data.devops?.cicd || []).join(', '))}</span></p>
          <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Version Control:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.devops?.versionControl)}</span></p>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>💡 Justifications</h3>
        {(data.justifications || []).map((j, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1f2a', 
            padding: '16px', 
            marginBottom: '10px', 
            borderRadius: '8px',
            border: '1px solid #2a3f5f',
            borderLeft: '4px solid #2196f3'
          }}>
            <strong style={{ color: '#4fc3f7' }}>{renderTextWithLinks(j.technology)}</strong>
            <p style={{ marginTop: '8px', marginBottom: '6px', color: '#ccc', lineHeight: '1.6' }}><strong style={{ color: '#90caf9' }}>Reason:</strong> {renderTextWithLinks(j.reason)}</p>
            <p style={{ marginBottom: '0', color: '#ccc', lineHeight: '1.6' }}><strong style={{ color: '#90caf9' }}>Tradeoffs:</strong> {renderTextWithLinks(j.tradeoffs)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function TimelineRenderer({ data }) {
  if (!data || data.parseError) {
    return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e5e5e5' }}>{data?.raw || 'No data'}</pre>;
  }

  return (
    <div style={{ color: '#e5e5e5' }}>
      <div style={{ 
        backgroundColor: '#1a2a1b', 
        padding: '18px', 
        marginBottom: '24px', 
        borderRadius: '8px',
        border: '1px solid #2a4a2b',
        borderLeft: '4px solid #4caf50'
      }}>
        <p style={{ marginBottom: '8px', lineHeight: '1.6' }}><strong style={{ color: '#81c784' }}>Total Duration:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.totalDuration)}</span></p>
        <p style={{ marginBottom: '8px', lineHeight: '1.6' }}><strong style={{ color: '#81c784' }}>Start:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.startDate)}</span> → <strong style={{ color: '#81c784' }}>End:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.endDate)}</span></p>
        <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#81c784' }}>Buffer Time:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(data.bufferTime)}</span></p>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>📅 Phases</h3>
        {(data.phases || []).map((phase, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1a1b', 
            padding: '18px', 
            marginBottom: '12px', 
            borderRadius: '8px',
            border: '1px solid #3a3a3b',
            borderLeft: '4px solid #2196f3'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#64b5f6' }}>{renderTextWithLinks(phase.name)}</h4>
            <p style={{ marginBottom: '10px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Timeline:</strong> <span style={{ color: '#ccc' }}>Week {renderTextWithLinks(phase.startWeek)} - {renderTextWithLinks(phase.endWeek)} ({renderTextWithLinks(phase.duration)})</span></p>
            
            <p style={{ marginBottom: '8px', fontWeight: '600', color: '#fff' }}>Tasks:</p>
            <ul style={{ marginBottom: '12px', marginLeft: '20px', color: '#ccc' }}>
              {phase.tasks?.map((task, i) => (
                <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5' }}>
                  {renderTextWithLinks(task.name)} ({renderTextWithLinks(task.duration)}) - {renderTextWithLinks(task.assignedTo)}
                </li>
              ))}
            </ul>

            {phase.dependencies?.length > 0 && (
              <p style={{ marginBottom: '8px', lineHeight: '1.6' }}>
                <strong style={{ color: '#10a37f' }}>Dependencies:</strong>{' '}
                <span style={{ color: '#ccc' }}>
                  {phase.dependencies.map((dep, i) => (
                    <React.Fragment key={i}>
                      {i > 0 ? ', ' : ''}
                      {renderTextWithLinks(dep)}
                    </React.Fragment>
                  ))}
                </span>
              </p>
            )}

            <p style={{ marginBottom: '0', lineHeight: '1.6' }}>
              <strong style={{ color: '#10a37f' }}>Deliverables:</strong>{' '}
              <span style={{ color: '#ccc' }}>
                {phase.deliverables?.map((deliv, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? ', ' : ''}
                    {renderTextWithLinks(deliv)}
                  </React.Fragment>
                ))}
              </span>
            </p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>🎯 Critical Path</h3>
        <div style={{ 
          backgroundColor: '#2a2416', 
          padding: '18px', 
          borderRadius: '8px',
          border: '1px solid #4a3a1b',
          borderLeft: '4px solid #ff9800',
          color: '#ffb74d',
          fontSize: '14px',
          lineHeight: '1.8',
          fontFamily: 'monospace'
        }}>
          {(data.criticalPath || []).map((step, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 ? ' → ' : ''}
              {renderTextWithLinks(step)}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>⚡ Parallel Tasks</h3>
        <ul style={{ marginLeft: '20px', color: '#ccc' }}>
          {(data.parallelTasks || []).map((task, idx) => (
            <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{renderTextWithLinks(task)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function RisksRenderer({ data }) {
  if (!data || data.parseError) {
    return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e5e5e5' }}>{data?.raw || 'No data'}</pre>;
  }

  const renderRiskSection = (title, risks) => (
    <section style={{ marginBottom: '32px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>{title}</h3>
      {(risks || []).map((risk, idx) => {
        const severityColor = risk.severity === 'High' ? '#ef5350' : 
                             risk.severity === 'Medium' ? '#ff9800' : '#4caf50';
        const bgColor = risk.severity === 'High' ? '#2a1a1a' : 
                       risk.severity === 'Medium' ? '#2a2416' : '#1a2a1b';
        const borderColor = risk.severity === 'High' ? '#4a2a2a' : 
                           risk.severity === 'Medium' ? '#4a3a1b' : '#2a4a2b';
        
        return (
          <div key={idx} style={{ 
            backgroundColor: bgColor, 
            padding: '16px', 
            marginBottom: '10px', 
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            borderLeft: `4px solid ${severityColor}`
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: severityColor }}>{renderTextWithLinks(risk.name)}</h4>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ 
                backgroundColor: severityColor, 
                color: 'white', 
                padding: '5px 10px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {risk.severity} Severity
              </span>
              <span style={{ 
                backgroundColor: '#5a5a5a', 
                color: 'white', 
                padding: '5px 10px', 
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {risk.probability} Probability
              </span>
            </div>
            <p style={{ marginBottom: '8px', color: '#ccc', lineHeight: '1.6' }}><strong style={{ color: '#fff' }}>Impact:</strong> {renderTextWithLinks(risk.impact)}</p>
            <p style={{ marginBottom: '6px', fontWeight: '600', color: '#fff' }}>Mitigation:</p>
            <ul style={{ marginBottom: '8px', marginLeft: '20px', color: '#ccc' }}>
              {risk.mitigation?.map((m, i) => <li key={i} style={{ marginBottom: '4px', lineHeight: '1.5' }}>{renderTextWithLinks(m)}</li>)}
            </ul>
            <p style={{ marginBottom: '12px', color: '#ccc', lineHeight: '1.6' }}><strong style={{ color: '#fff' }}>Contingency:</strong> {renderTextWithLinks(risk.contingency)}</p>
          </div>
        );
      })}
    </section>
  );

  return (
    <div style={{ color: '#e5e5e5' }}>
      <div style={{ 
        backgroundColor: data.overallRiskLevel === 'High' ? '#2a1a1a' : 
                       data.overallRiskLevel === 'Medium' ? '#2a2416' : '#1a2a1b',
        padding: '18px', 
        marginBottom: '24px', 
        borderRadius: '8px',
        border: '1px solid ' + (data.overallRiskLevel === 'High' ? '#4a2a2a' : 
                               data.overallRiskLevel === 'Medium' ? '#4a3a1b' : '#2a4a2b'),
        borderLeft: '4px solid ' + (data.overallRiskLevel === 'High' ? '#ef5350' : 
                                   data.overallRiskLevel === 'Medium' ? '#ff9800' : '#4caf50')
      }}>
        <p style={{ marginBottom: '8px', lineHeight: '1.6' }}><strong style={{ color: data.overallRiskLevel === 'High' ? '#ef5350' : data.overallRiskLevel === 'Medium' ? '#ffb74d' : '#81c784' }}>Overall Risk Level:</strong> <span style={{ color: '#fff' }}>{renderTextWithLinks(data.overallRiskLevel)}</span></p>
        <p style={{ marginBottom: '0', lineHeight: '1.6' }}>
          <strong style={{ color: '#fff' }}>Top Risks:</strong>{' '}
          <span style={{ color: '#ccc' }}>
            {(data.topRisks || []).map((top, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 ? ', ' : ''}
                {renderTextWithLinks(top)}
              </React.Fragment>
            ))}
          </span>
        </p>
      </div>

      {renderRiskSection('⚙️ Technical Risks', data.technical)}
      {renderRiskSection('💼 Business Risks', data.business)}
      {renderRiskSection('👥 Team Risks', data.team)}
    </div>
  );
}

export function DeliverablesRenderer({ data }) {
  if (!data || data.parseError) {
    return <pre style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e5e5e5' }}>{data?.raw || 'No data'}</pre>;
  }

  return (
    <div style={{ color: '#e5e5e5' }}>
      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>💻 Code Deliverables</h3>
        {(data.code || []).map((item, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1a1b', 
            padding: '18px', 
            marginBottom: '12px', 
            borderRadius: '8px',
            border: '1px solid #3a3a3b'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px', color: '#10a37f' }}>{renderTextWithLinks(item.name)}</h4>
            <p style={{ marginBottom: '8px', lineHeight: '1.6' }}><strong style={{ color: '#10a37f' }}>Type:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(item.type)}</span></p>
            <p style={{ marginBottom: '14px', lineHeight: '1.6', color: '#ccc' }}>{renderTextWithLinks(item.description)}</p>
            
            <div style={{ 
              backgroundColor: '#242425', 
              padding: '12px', 
              marginBottom: '14px',
              borderRadius: '6px',
              borderLeft: '3px solid #10a37f'
            }}>
              <p style={{ marginBottom: '8px', fontWeight: '600', color: '#fff' }}>Quality Standards:</p>
              <ul style={{ marginBottom: 0, marginLeft: '20px', color: '#ccc', fontSize: '13px' }}>
                <li style={{ marginBottom: '4px' }}>Test Coverage: {renderTextWithLinks(item.qualityStandards?.testCoverage)}</li>
                <li style={{ marginBottom: '4px' }}>Code Review: {item.qualityStandards?.codeReview ? '✅ Required' : '❌ Not required'}</li>
                <li>Documentation: {item.qualityStandards?.documentation ? '✅ Required' : '❌ Not required'}</li>
              </ul>
            </div>

            <p style={{ marginBottom: '8px', fontWeight: '600', color: '#fff' }}>Acceptance Criteria:</p>
            <ul style={{ marginLeft: '20px', color: '#ccc', marginBottom: '0' }}>
              {item.acceptanceCriteria?.map((criteria, i) => (
                <li key={i} style={{ marginBottom: '6px', lineHeight: '1.5' }}>{renderTextWithLinks(criteria)}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>📚 Documentation</h3>
        {(data.documentation || []).map((doc, idx) => (
          <div key={idx} style={{ 
            backgroundColor: '#1a1f2a', 
            padding: '16px', 
            marginBottom: '10px', 
            borderRadius: '8px',
            border: '1px solid #2a3f5f',
            borderLeft: '4px solid #2196f3'
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#4fc3f7' }}>{renderTextWithLinks(doc.type)}</h4>
            <p style={{ marginBottom: '6px', lineHeight: '1.6' }}><strong style={{ color: '#90caf9' }}>Format:</strong> <span style={{ color: '#ccc' }}>{renderTextWithLinks(doc.format)}</span></p>
            <p style={{ marginBottom: '0', lineHeight: '1.6' }}><strong style={{ color: '#90caf9' }}>Sections:</strong> <span style={{ color: '#ccc' }}>{(doc.sections || []).map((section, i) => (
              <React.Fragment key={i}>
                {i > 0 ? ', ' : ''}
                {renderTextWithLinks(section)}
              </React.Fragment>
            ))}</span></p>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>🧪 Testing</h3>
        <div style={{ 
          backgroundColor: '#1a1a1b', 
          padding: '18px', 
          borderRadius: '8px',
          border: '1px solid #3a3a3b'
        }}>
          <p style={{ marginBottom: '10px', lineHeight: '1.6', color: '#ccc' }}>✅ <strong style={{ color: '#81c784' }}>Unit Test Coverage:</strong> {renderTextWithLinks(data.testing?.unitTestCoverage)}%</p>
          <p style={{ marginBottom: '10px', lineHeight: '1.6', color: '#ccc' }}>✅ <strong style={{ color: '#81c784' }}>Integration Tests:</strong> {data.testing?.integrationTests ? 'Required' : 'Not required'}</p>
          <p style={{ marginBottom: '0', lineHeight: '1.6', color: '#ccc' }}>✅ <strong style={{ color: '#81c784' }}>Performance Tests:</strong> {data.testing?.performanceTests ? 'Required' : 'Not required'}</p>
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>✅ Definition of Done</h3>
        <div style={{ 
          backgroundColor: '#1a2a1b', 
          padding: '18px', 
          borderRadius: '8px',
          border: '1px solid #2a4a2b',
          borderLeft: '4px solid #4caf50'
        }}>
          <ul style={{ marginBottom: '0', marginLeft: '20px', color: '#ccc' }}>
            {(data.definitionOfDone || []).map((item, idx) => (
              <li key={idx} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{renderTextWithLinks(item)}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
