import React from 'react';

const ConnectionStatus = ({ data }) => {
  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Connection Status</h4>
      <div style={{ fontSize: '14px' }}>
        {data ? data : 'Loading connection...'}
      </div>
    </div>
  );
};

export default ConnectionStatus;