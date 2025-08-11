import React, { useEffect, useState } from 'react';
import { invoke } from '@forge/bridge';
import SpaceSelector from './components/SpaceSelector';
import MigrationProgress from './components/MigrationProgress';
import StatusNotifications from './components/StatusNotifications';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const [data, setData] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [ismigrating, setIsmigrating] = useState(false);
  const [migrationDetails, setMigrationDetails] = useState({
    totalItems: 0,
    migratedItems: 0,
    currentItem: '',
    status: 'idle'
  });
  const [migrationLog, setMigrationLog] = useState([]);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      console.log('Fetching spaces...');
      const spacesData = await invoke('getSpaces');
      console.log('Received spaces data:', spacesData);
      
      if (Array.isArray(spacesData) && spacesData.length > 0) {
        setSpaces(spacesData);
        console.log('Set spaces to:', spacesData);
        console.log('Space IDs:', spacesData.map(s => ({ id: s.id, name: s.name, key: s.key })));
      } else {
        console.log('No spaces data received, using fallback');
        const fallbackSpaces = [
          { id: 'CMT', name: 'Confluence Migration Testing', key: 'CMT' },
          { id: 'space1', name: 'Documentation Space', key: 'DOCS' },
          { id: 'space2', name: 'Development Space', key: 'DEV' }
        ];
        setSpaces(fallbackSpaces);
        console.log('Set fallback spaces to:', fallbackSpaces);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
      const fallbackSpaces = [
        { id: 'CMT', name: 'Confluence Migration Testing', key: 'CMT' },
        { id: 'space1', name: 'Documentation Space', key: 'DOCS' },
        { id: 'space2', name: 'Development Space', key: 'DEV' }
      ];
      setSpaces(fallbackSpaces);
      console.log('Set error fallback spaces to:', fallbackSpaces);
    }
  };

  const addToLog = (message, status = 'info', itemType = '') => {
    const timestamp = new Date().toLocaleTimeString();
    setMigrationLog(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      status,
      itemType
    }]);
  };

  const handleMigrate = async () => {
    console.log('handleMigrate called');
    console.log('selectedSpace:', selectedSpace);
    console.log('spaces:', spaces);
    
    if (!selectedSpace) {
      alert('Please select a space to migrate');
      return;
    }

    // Convert both to strings for consistent comparison
    const selectedSpaceData = spaces.find(s => String(s.id) === String(selectedSpace));
    console.log('selectedSpaceData:', selectedSpaceData);
    console.log('Looking for ID:', selectedSpace, 'type:', typeof selectedSpace);
    console.log('Available space IDs:', spaces.map(s => ({ id: s.id, type: typeof s.id })));
    
    if (!selectedSpaceData) {
      alert('Selected space not found in spaces list');
      return;
    }

    setIsmigrating(true);
    setMigrationProgress(0);
    setMigrationLog([]);
    setMigrationDetails({
      totalItems: 20,
      migratedItems: 0,
      currentItem: 'Initializing migration...',
      status: 'in_progress'
    });

    addToLog('🚀 Starting migration process...', 'info');
    addToLog(`🏢 Selected space: ${selectedSpaceData.name} (${selectedSpaceData.key})`, 'info');

    try {
      await performRealMigration(selectedSpaceData);
    } catch (error) {
      addToLog(`❌ Migration failed: ${error.message}`, 'error');
      setMigrationDetails(prev => ({
        ...prev,
        status: 'error',
        currentItem: `Migration failed: ${error.message}`
      }));
    } finally {
      setIsmigrating(false);
    }
  };

  const performRealMigration = async (spaceData) => {
    if (!spaceData) {
      throw new Error('No space selected');
    }

    let itemCount = 0;
    
    const updateProgress = (totalItems) => {
      itemCount++;
      const progressPercent = (itemCount / totalItems) * 100;
      setMigrationProgress(progressPercent);
      setMigrationDetails(prev => ({
        ...prev,
        migratedItems: itemCount,
        totalItems: totalItems
      }));
    };

    try {
      // Step 1: Get space details and count content
      addToLog('🔍 Analyzing space content...', 'info');
      setMigrationDetails(prev => ({ ...prev, currentItem: 'Analyzing space content...' }));
      
      const spaceDetails = await invoke('getSpaceDetails', { spaceKey: spaceData.key });
      if (!spaceDetails.success) {
        throw new Error(`Failed to get space details: ${spaceDetails.error}`);
      }

      const contentCounts = await invoke('countSpaceContent', { spaceKey: spaceData.key });
      if (!contentCounts.success) {
        throw new Error(`Failed to count space content: ${contentCounts.error}`);
      }

      const totalItems = contentCounts.counts.totalItems;
      
      // Create detailed content summary including folders
      let contentSummary = `📊 Found ${contentCounts.counts.totalPages} pages`;
      if (contentCounts.counts.totalFolders > 0) {
        contentSummary += `, ${contentCounts.counts.totalFolders} folders`;
      }
      contentSummary += `, ${contentCounts.counts.totalAttachments} attachments, ${contentCounts.counts.totalComments} comments`;
      
      addToLog(contentSummary, 'success');
      
      // Add folder breakdown if folders exist
      if (contentCounts.counts.totalFolders > 0) {
        addToLog(`📁 Folder breakdown: ${contentCounts.counts.rootFolders} root folders, ${contentCounts.counts.childFolders} nested folders`, 'info');
      }
      
      setMigrationDetails(prev => ({
        ...prev,
        totalItems: totalItems
      }));

      // Step 2: Create target space with timestamp to avoid conflicts
      // Confluence space keys must be uppercase and contain only letters, numbers, and underscores
      const timestamp = Date.now().toString().slice(-6); // Use last 6 digits of timestamp
      const targetSpaceKey = `${spaceData.key}MIG${timestamp}`.toUpperCase();
      const targetSpaceName = `${spaceData.name} (Migrated ${new Date().toLocaleDateString()})`;
      
      addToLog(`🏗️ Creating target space: ${targetSpaceKey}`, 'info');
      setMigrationDetails(prev => ({ ...prev, currentItem: `Creating target space: ${targetSpaceKey}` }));
      
      addToLog(`🏗️ Target space will be created during migration process`, 'info');
      updateProgress(totalItems);

      // Step 3: Perform full migration
      addToLog('🚀 Starting full space migration...', 'info');
      setMigrationDetails(prev => ({ ...prev, currentItem: 'Migrating space content...' }));
      
      const migrationResult = await invoke('migrateSpace', {
        sourceSpaceKey: spaceData.key,
        sourceSpaceId: spaceData.id,
        targetSpaceKey: targetSpaceKey,
        targetSpaceName: targetSpaceName,
        targetSpaceDescription: `Migrated from ${spaceData.name}`
      });

      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.error}`);
      }

      // Process migration results
      const results = migrationResult.migrationResults || [];
      const successfulMigrations = results.filter(r => r.success);
      const failedMigrations = results.filter(r => !r.success);

      // Update progress for each successful migration
      successfulMigrations.forEach(result => {
        addToLog(`✅ Page migrated: ${result.title}`, 'success', 'page');
        updateProgress(totalItems);
      });

      // Log failed migrations
      failedMigrations.forEach(result => {
        addToLog(`❌ Failed to migrate page: ${result.error}`, 'error', 'page');
        updateProgress(totalItems);
      });

      // Final status
      if (failedMigrations.length === 0) {
        addToLog('🎉 Migration completed successfully!', 'success');
        addToLog(`📊 Migrated ${successfulMigrations.length} pages successfully`, 'success');
      } else {
        addToLog(`⚠️ Migration completed with ${failedMigrations.length} errors`, 'warning');
        addToLog(`📊 Successfully migrated ${successfulMigrations.length}/${results.length} pages`, 'warning');
      }

      setMigrationProgress(100);
      setMigrationDetails(prev => ({
        ...prev,
        migratedItems: totalItems,
        currentItem: 'Migration completed!',
        status: failedMigrations.length === 0 ? 'completed' : 'completed_with_errors'
      }));

    } catch (error) {
      addToLog(`❌ Migration error: ${error.message}`, 'error');
      throw error;
    }
  };

  const simulateMigration = async () => {
    let itemCount = 0;
    const totalItems = 20;

    const updateProgress = () => {
      itemCount++;
      setMigrationProgress((itemCount / totalItems) * 100);
      setMigrationDetails(prev => ({
        ...prev,
        migratedItems: itemCount
      }));
    };

    // Phase 1: Analyzing workspace structure
    addToLog('🔍 Analyzing workspace structure...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Analyzing workspace structure...' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addToLog('📊 Found space with 15 pages and 3 sub-spaces', 'success');
    addToLog('📋 Found 2 dashboards in workspace', 'success');
    addToLog('📎 Found 5 attachments to migrate', 'success');
    updateProgress();

    // Phase 2: Migrating space content
    addToLog('🏢 Migrating space: "Development Space"', 'info', 'space');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Migrating space content...' }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    addToLog('✅ Space structure migrated successfully', 'success', 'space');
    updateProgress();

    // Phase 3: Migrating pages
    const pages = [
      'Authentication Guide',
      'API Endpoints Reference', 
      'Response Examples'
    ];

    for (const page of pages) {
      addToLog(`📄 Migrating page: "${page}"`, 'info', 'page');
      setMigrationDetails(prev => ({ ...prev, currentItem: `Migrating page: ${page}` }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToLog(`✅ Page "${page}" migrated successfully`, 'success', 'page');
      updateProgress();
    }

    // Phase 4: Migrating dashboards
    const dashboards = ['API Status Dashboard', 'Usage Analytics Dashboard'];
    
    for (const dashboard of dashboards) {
      addToLog(`📊 Migrating dashboard: "${dashboard}"`, 'info', 'dashboard');
      setMigrationDetails(prev => ({ ...prev, currentItem: `Migrating dashboard: ${dashboard}` }));
      await new Promise(resolve => setTimeout(resolve, 1200));
      addToLog(`✅ Dashboard "${dashboard}" migrated successfully`, 'success', 'dashboard');
      updateProgress();
    }

    // Phase 5: Migrating attachments
    const attachments = [
      'api-schema.json',
      'postman-collection.json',
      'authentication-flow.png',
      'error-codes.pdf',
      'sample-response.xml'
    ];

    addToLog('📎 Starting attachment migration...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Migrating attachments...' }));
    
    for (const attachment of attachments) {
      addToLog(`📎 Migrating attachment: "${attachment}"`, 'info', 'attachment');
      await new Promise(resolve => setTimeout(resolve, 800));
      addToLog(`✅ Attachment "${attachment}" migrated successfully`, 'success', 'attachment');
      updateProgress();
    }

    // Phase 6: Migrating comments and metadata
    addToLog('💬 Migrating comments and discussions...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Migrating comments...' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToLog('✅ 12 comments migrated successfully', 'success');
    updateProgress();

    addToLog('🏷️ Migrating labels and metadata...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Migrating metadata...' }));
    await new Promise(resolve => setTimeout(resolve, 800));
    addToLog('✅ Labels and metadata migrated successfully', 'success');
    updateProgress();

    // Phase 7: Finalizing
    addToLog('🔧 Updating space relationships and links...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Updating relationships...' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToLog('✅ Space relationships updated successfully', 'success');
    updateProgress();

    addToLog('🎯 Finalizing migration and cleanup...', 'info');
    setMigrationDetails(prev => ({ ...prev, currentItem: 'Finalizing migration...' }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    addToLog('✅ Migration completed successfully!', 'success');
    
    setMigrationProgress(100);
    setMigrationDetails(prev => ({
      ...prev,
      migratedItems: totalItems,
      currentItem: 'Migration completed successfully!',
      status: 'completed'
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '20px', color: '#253858' }}>Confluence Space Migration</h2>
      
      <SpaceSelector
        spaces={spaces}
        selectedSpace={selectedSpace}
        onSpaceChange={setSelectedSpace}
        ismigrating={ismigrating}
        onMigrate={handleMigrate}
      />

      {ismigrating && (
        <MigrationProgress
          migrationProgress={migrationProgress}
          migrationDetails={migrationDetails}
          migrationLog={migrationLog}
        />
      )}

      <StatusNotifications
        migrationDetails={migrationDetails}
        migrationLog={migrationLog}
      />

      <ConnectionStatus data={data} />
    </div>
  );
}

export default App;
