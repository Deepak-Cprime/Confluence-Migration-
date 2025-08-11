import React from 'react';

const MigrationLog = ({ migrationLog, title = "Migration Log", maxHeight = "200px" }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#253858' }}>{title}</h4>
      <div style={{
        maxHeight: maxHeight,
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        padding: '10px'
      }}>
        {migrationLog.map(log => (
          <div key={log.id} style={{
            fontSize: '12px',
            marginBottom: '4px',
            padding: '4px 8px',
            borderRadius: '3px',
            backgroundColor: log.status === 'error' ? '#FFEBE6' : log.status === 'success' ? '#E3FCEF' : '#F4F5F7',
            color: log.status === 'error' ? '#DE350B' : log.status === 'success' ? '#00875A' : '#42526E'
          }}>
            <span style={{ color: '#666', marginRight: '8px' }}>[{log.timestamp}]</span>
            {log.message}
          </div>
        ))}
        {migrationLog.length === 0 && (
          <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
            Migration log will appear here...
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationLog;