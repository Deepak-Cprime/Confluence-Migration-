import React from 'react';
import MigrationLog from './MigrationLog';

const MigrationProgress = ({ migrationProgress, migrationDetails, migrationLog }) => {
  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#253858' }}>Migration Progress</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <div style={{ 
          width: '100%', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '10px', 
          height: '20px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${migrationProgress}%`,
            backgroundColor: '#36B37E',
            height: '100%',
            borderRadius: '10px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px', fontWeight: 'bold' }}>
          {Math.round(migrationProgress)}%
        </div>
      </div>

      <div style={{ fontSize: '14px', marginBottom: '10px' }}>
        <strong>Status:</strong> {migrationDetails.currentItem}
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        Progress: {migrationDetails.migratedItems} of {migrationDetails.totalItems} steps completed
      </div>

      <MigrationLog 
        migrationLog={migrationLog} 
        title="Migration Log" 
        maxHeight="200px" 
      />
    </div>
  );
};

export default MigrationProgress;