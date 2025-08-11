import React from 'react';
import MigrationLog from './MigrationLog';

const StatusNotifications = ({ migrationDetails, migrationLog }) => {
  if (migrationDetails.status === 'completed') {
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#E3FCEF', border: '1px solid #36B37E', borderRadius: '8px', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#00875A' }}>Migration Completed Successfully!</h4>
          <p style={{ margin: '0', fontSize: '14px' }}>
            The selected page has been successfully migrated to this Confluence instance.
          </p>
        </div>
        
        <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <MigrationLog 
            migrationLog={migrationLog} 
            title="Complete Migration Log" 
            maxHeight="300px" 
          />
        </div>
      </div>
    );
  }

  if (migrationDetails.status === 'error') {
    return (
      <div style={{ padding: '15px', backgroundColor: '#FFEBE6', border: '1px solid #DE350B', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#DE350B' }}>Migration Failed</h4>
        <p style={{ margin: '0', fontSize: '14px' }}>
          {migrationDetails.currentItem}
        </p>
      </div>
    );
  }

  return null;
};

export default StatusNotifications;