import React from 'react';

const SpaceSelector = ({ spaces, selectedSpace, onSpaceChange, ismigrating, onMigrate }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <select 
        value={selectedSpace} 
        onChange={(e) => onSpaceChange(e.target.value)}
        style={{ marginRight: '10px', padding: '8px', minWidth: '200px' }}
        disabled={ismigrating}
      >
        <option value="">Select Space to Migrate</option>
        {spaces.map(space => (
          <option key={space.id} value={String(space.id)}>
            {space.name} ({space.key})
          </option>
        ))}
      </select>
      <button 
        onClick={onMigrate}
        disabled={ismigrating || !selectedSpace}
        style={{ 
          padding: '8px 16px', 
          backgroundColor: ismigrating ? '#ccc' : '#0052CC', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: ismigrating ? 'not-allowed' : 'pointer' 
        }}
      >
        {ismigrating ? 'Migrating...' : 'Migrate'}
      </button>
    </div>
  );
};

export default SpaceSelector;