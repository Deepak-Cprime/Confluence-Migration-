// Clean migration function - just the essential parts
const cleanMigrateSpace = async (req, sourceConfluenceAPI, api, route) => {
  console.log('🔵 MIGRATION RESOLVER CALLED');
  console.log('🔵 Request payload:', req.payload);
  
  const { sourceSpaceKey, sourceSpaceId, targetSpaceKey, targetSpaceName, targetSpaceDescription } = req.payload;
  console.log('🔵 Extracted variables:', { sourceSpaceKey, sourceSpaceId, targetSpaceKey, targetSpaceName });
  
  try {
    console.log('🔵 ENTERED TRY BLOCK');
    
    // Step 1: Create target space
    console.log('📋 Step 1: Creating target space...');
    let spaceCreated = false;
    let spaceError = null;
    
    try {
      const spaceData = {
        key: targetSpaceKey,
        name: targetSpaceName,
        description: targetSpaceDescription || '',
        type: 'global'
      };
      console.log('🔵 Attempting to create space:', spaceData);
      
      const response = await api.asApp().requestConfluence(route`/wiki/rest/api/space`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spaceData)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Target space created successfully:', responseData.key);
        spaceCreated = true;
      } else {
        const errorData = await response.text();
        console.log('❌ Space creation failed:', response.status, errorData);
        spaceError = `Space creation failed: ${response.status} ${errorData}`;
      }
    } catch (error) {
      console.log('❌ Space creation exception:', error.message);
      spaceError = error.message;
    }
    
    // Step 2: Get pages (skip folders for now)
    console.log('📋 Step 2: Fetching pages...');
    const pagesResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${sourceSpaceKey}&type=page&limit=1000&expand=ancestors`);
    const pages = pagesResponse.data.results || [];
    console.log(`📄 Found ${pages.length} pages`);
    
    // Step 3: Simple migration (just try to create 1 page for testing)
    console.log('📋 Step 3: Testing page creation...');
    let migratedCount = 0;
    let failedCount = 0;
    const migrationResults = [];
    
    if (pages.length > 0 && spaceCreated) {
      const firstPage = pages[0];
      console.log(`🔧 Testing with first page: ${firstPage.title}`);
      
      try {
        const pageData = {
          type: 'page',
          title: `[TEST] ${firstPage.title}`,
          space: { key: targetSpaceKey },
          body: {
            storage: {
              value: '<p>Test migration successful!</p>',
              representation: 'storage'
            }
          }
        };
        
        const createResponse = await api.asApp().requestConfluence(route`/wiki/rest/api/content`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pageData)
        });
        
        if (createResponse.ok) {
          const createdPage = await createResponse.json();
          console.log('✅ Test page created:', createdPage.id);
          migratedCount = 1;
          migrationResults.push({
            sourceId: firstPage.id,
            targetId: createdPage.id,
            title: firstPage.title,
            success: true
          });
        } else {
          const errorText = await createResponse.text();
          console.log('❌ Page creation failed:', createResponse.status, errorText);
          failedCount = 1;
          migrationResults.push({
            sourceId: firstPage.id,
            title: firstPage.title,
            success: false,
            error: `${createResponse.status}: ${errorText}`
          });
        }
      } catch (pageError) {
        console.log('❌ Page creation exception:', pageError.message);
        failedCount = 1;
        migrationResults.push({
          sourceId: firstPage.id,
          title: firstPage.title,
          success: false,
          error: pageError.message
        });
      }
    }
    
    // Final result
    console.log('🎉 Test migration completed');
    console.log(`📊 Results: Space created: ${spaceCreated}, Pages migrated: ${migratedCount}, Failed: ${failedCount}`);
    
    return {
      success: true,
      message: `Test migration completed. Space: ${spaceCreated ? 'Created' : 'Failed'}, Pages: ${migratedCount}`,
      sourceSpaceKey,
      targetSpaceKey,
      spaceCreated,
      spaceError,
      migrationResults,
      counts: {
        totalPages: pages.length,
        totalFolders: 0, // Skipped for now
        totalItems: pages.length,
        migratedCount,
        failedCount
      }
    };
    
  } catch (error) {
    console.log('🔴 MAIN MIGRATION CATCH BLOCK REACHED');
    console.log('🔴 Error type:', error.constructor.name);
    console.log('🔴 Error message:', error.message);
    console.log('🔴 Error stack:', error.stack);
    console.error('❌ Space migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { cleanMigrateSpace };