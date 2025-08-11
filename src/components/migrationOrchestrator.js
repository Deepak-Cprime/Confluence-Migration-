import { getAllSpaceContent } from './contentService.js';
import { createContent, migrateAttachments, migrateComments } from './migrationService.js';
import { createTargetSpace, getSpaceDetails } from './spaceService.js';

export const performFullSpaceMigration = async (
  sourceConfluenceAPI, 
  sourceSpaceKey, 
  sourceSpaceId, 
  targetSpaceKey, 
  targetSpaceName, 
  targetSpaceDescription
) => {
  console.log('Starting full space migration from', sourceSpaceKey, '(ID:', sourceSpaceId, ') to', targetSpaceKey);
  
  try {
    // Step 0: Get source space details to obtain space name for filtering
    console.log('Getting source space details...');
    const spaceDetailsResult = await getSpaceDetails(sourceConfluenceAPI, sourceSpaceKey);
    const spaceName = spaceDetailsResult.success ? spaceDetailsResult.space.name : null;
    console.log('Source space name:', spaceName);
    
    // Step 1: Create target space using Forge API
    console.log('Creating target space using Forge API...');
    console.log('Target space key:', targetSpaceKey);
    console.log('Target space name:', targetSpaceName);
    
    const spaceData = {
      key: targetSpaceKey,
      name: targetSpaceName,
      description: {
        plain: {
          value: targetSpaceDescription || '',
          representation: 'plain'
        }
      },
      type: 'global'
    };
    
    console.log('Space data to create:', JSON.stringify(spaceData, null, 2));
    
    let createSpaceResult = { success: true };
    try {
      const spaceResult = await createTargetSpace(targetSpaceKey, targetSpaceName, targetSpaceDescription);
      createSpaceResult = spaceResult;
    } catch (spaceError) {
      console.log('Target space creation failed:', spaceError.message);
      createSpaceResult = { 
        success: false, 
        error: spaceError.message, 
        continueAnyway: true,
        fallbackToSource: true 
      };
    }
    
    // Step 2: Get content from source space (with filtering)
    console.log('Fetching content from source space...');
    const { pages, folders } = await getAllSpaceContent(sourceConfluenceAPI, sourceSpaceKey, spaceName);
    
    const allContent = [...pages, ...folders];
    console.log('Total content items found:', allContent.length);
    
    if (!Array.isArray(allContent)) {
      throw new Error('Content data is not an array');
    }
    
    // Log all content types found
    const contentTypes = [...new Set(allContent.map(item => item.type))];
    console.log('Content types found:', contentTypes);
    
    // Separate different types of content
    const rootPages = pages.filter(page => !page.ancestors || page.ancestors.length === 0);
    const childPages = pages.filter(page => page.ancestors && page.ancestors.length > 0);
    const rootFolders = folders.filter(folder => !folder.ancestors || folder.ancestors.length === 0);
    const childFolders = folders.filter(folder => folder.ancestors && folder.ancestors.length > 0);
    
    let totalAttachments = 0;
    let totalComments = 0;
    
    for (const page of pages) {
      try {
        // Use source API for attachments
        const attachmentsResponse = await sourceConfluenceAPI.get(`/content/${page.id}/child/attachment`);
        totalAttachments += (attachmentsResponse.data.results || []).length;
        
        // Use source API for comments  
        const commentsResponse = await sourceConfluenceAPI.get(`/content/${page.id}/child/comment`);
        totalComments += (commentsResponse.data.results || []).length;
      } catch (error) {
        console.warn(`Error counting content for page ${page.id}:`, error.message);
      }
    }
    
    const counts = {
      totalPages: pages.length,
      totalFolders: folders.length,
      rootPages: rootPages.length,
      childPages: childPages.length,
      rootFolders: rootFolders.length,
      childFolders: childFolders.length,
      totalAttachments,
      totalComments,
      totalItems: pages.length + folders.length + totalAttachments + totalComments
    };
    
    // Step 3: Migrate content with proper ordering
    console.log('Starting content migration...');
    const migrationResults = await migrateContentInOrder(
      sourceConfluenceAPI,
      allContent,
      rootFolders,
      childFolders,
      rootPages,
      childPages,
      targetSpaceKey,
      sourceSpaceKey,
      createSpaceResult
    );
    
    return {
      success: true,
      message: 'Space migration completed',
      sourceSpaceKey,
      targetSpaceKey,
      counts,
      migrationResults,
      spaceCreationResult: createSpaceResult
    };
    
  } catch (error) {
    console.error('Space migration failed:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

const migrateContentInOrder = async (
  sourceConfluenceAPI,
  allContent,
  rootFolders,
  childFolders,
  rootPages,
  childPages,
  targetSpaceKey,
  sourceSpaceKey,
  createSpaceResult
) => {
  console.log('📂 Content organization:');
  console.log(`   Root folders (${rootFolders.length}):`, rootFolders.map(f => `${f.title} (${f.id})`));
  console.log(`   Child folders (${childFolders.length}):`, childFolders.map(f => `${f.title} (${f.id}) -> parent: ${f.ancestors?.[f.ancestors.length - 1]?.id}`));
  console.log(`   Root pages (${rootPages.length}):`, rootPages.map(p => `${p.title} (${p.id})`));
  console.log(`   Child pages (${childPages.length}):`, childPages.map(p => `${p.title} (${p.id}) -> parent: ${p.ancestors?.[p.ancestors.length - 1]?.id}`));
  
  const migrationResults = [];
  
  // Create proper migration order to maintain hierarchy
  const sortedChildFolders = childFolders.sort((a, b) => (a.ancestors?.length || 0) - (b.ancestors?.length || 0));
  const sortedChildPages = childPages.sort((a, b) => {
    const depthA = a.ancestors?.length || 0;
    const depthB = b.ancestors?.length || 0;
    if (depthA !== depthB) return depthA - depthB;
    
    // If same depth, sort by parent ID to keep folder children together
    const parentA = a.ancestors?.[a.ancestors.length - 1]?.id || '';
    const parentB = b.ancestors?.[b.ancestors.length - 1]?.id || '';
    return parentA.localeCompare(parentB);
  });
  
  const allContentIds = [
    ...rootFolders.map(f => f.id),
    ...sortedChildFolders.map(f => f.id), 
    ...rootPages.map(p => p.id), 
    ...sortedChildPages.map(p => p.id)
  ];
  
  console.log('Migration order:', {
    rootFolders: rootFolders.length,
    childFolders: sortedChildFolders.length, 
    rootPages: rootPages.length,
    childPages: sortedChildPages.length,
    total: allContentIds.length
  });
  
  let migratedCount = 0;
  let failedCount = 0;
  
  console.log(`🚀 Starting migration of ${allContentIds.length} items...`);
  
  for (let i = 0; i < allContentIds.length; i++) {
    const contentId = allContentIds[i];
    let sourceContent = null;
    
    try {
      console.log(`\n📋 Processing item ${i + 1}/${allContentIds.length}: ${contentId}`);
      
      // Get content details using source API  
      const contentResponse = await sourceConfluenceAPI.get(`/content/${contentId}?expand=body.storage,ancestors,space`);
      sourceContent = contentResponse.data;
      
      console.log(`📄 Migrating ${sourceContent.type}: "${sourceContent.title}" (ID: ${contentId})`);
      console.log(`📊 Progress: ${i + 1}/${allContentIds.length} (${Math.round(((i + 1) / allContentIds.length) * 100)}%)`);
      
      // Handle parent relationship (ancestors in v1 API)
      let targetContentData = {
        spaceId: createSpaceResult.spaceId,
        status: 'current',
        title: `[MIGRATED] ${sourceContent.title}`,
        body: {
          representation: 'storage',
          value: sourceContent.body?.storage?.value || sourceContent.body?.value || ''
        }
      };
      
      if (sourceContent.ancestors && sourceContent.ancestors.length > 0) {
        const parentId = sourceContent.ancestors[sourceContent.ancestors.length - 1].id;
        const parentMapping = migrationResults.find(result => result.sourceId === parentId);
        if (parentMapping) {
          console.log(`📎 Setting parent relationship: "${sourceContent.title}" (${sourceContent.type}) -> parent: "${parentMapping.title}" (${parentMapping.type}, ID: ${parentMapping.targetId})`);
          targetContentData.ancestors = [{ id: parentMapping.targetId }];
          
          if (sourceContent.type === 'page' && parentMapping.type === 'folder') {
            console.log(`📁 Page "${sourceContent.title}" will be placed in folder "${parentMapping.title}"`);
          }
        } else {
          console.warn(`❌ Parent not found in migration results for ${sourceContent.title}. Parent ID: ${parentId}`);
          console.log('📋 Available parent mappings:', migrationResults.map(r => ({ 
            sourceId: r.sourceId, 
            targetId: r.targetId, 
            title: r.title, 
            type: r.type 
          })));
        }
      } else {
        console.log(`📌 "${sourceContent.title}" is a root-level ${sourceContent.type}`);
      }
      
      // Create the content
      const createResponseData = await createContent(sourceContent, targetSpaceKey, sourceSpaceKey, targetContentData);
      
      // Ensure createResponseData exists before proceeding
      if (!createResponseData) {
        throw new Error(`No response data available for ${sourceContent.type} "${sourceContent.title}"`);
      }
      
      // Add to migration results
      migrationResults.push({
        sourceId: contentId,
        targetId: createResponseData.id,
        title: sourceContent.title,
        type: sourceContent.type,
        success: true
      });
      
      migratedCount++;
      console.log(`✅ Item ${i + 1} completed successfully. Total migrated: ${migratedCount}`);
      
      // Migrate attachments and comments only for pages (not folders)
      if (sourceContent.type === 'page') {
        try {
          await migrateAttachments(sourceConfluenceAPI, contentId, createResponseData.id);
          await migrateComments(sourceConfluenceAPI, contentId, createResponseData.id);
        } catch (error) {
          console.warn(`Error migrating attachments/comments for ${sourceContent.title}:`, error.message);
        }
      }
      
    } catch (error) {
      failedCount++;
      console.error(`❌ Error migrating ${sourceContent?.type || 'content'} "${sourceContent?.title || 'Unknown'}" (ID: ${contentId}):`);
      console.error(`❌ Error details:`, error.response?.data || error.message);
      console.error(`❌ Failed items so far: ${failedCount}`);
      
      migrationResults.push({
        sourceId: contentId,
        title: sourceContent?.title || 'Unknown',
        type: sourceContent?.type || 'unknown',
        success: false,
        error: error.response?.data?.message || error.message
      });
    }
  }
  
  // Final migration summary
  console.log('\n🎉 MIGRATION COMPLETED!');
  console.log('='.repeat(50));
  console.log(`📊 Migration Summary:`);
  console.log(`   Total items processed: ${allContentIds.length}`);
  console.log(`   Successfully migrated: ${migratedCount}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Success rate: ${Math.round((migratedCount / allContentIds.length) * 100)}%`);
  
  // Breakdown by type
  const typeBreakdown = migrationResults.reduce((acc, result) => {
    const type = result.type || 'unknown';
    if (!acc[type]) acc[type] = { success: 0, failed: 0 };
    if (result.success) acc[type].success++;
    else acc[type].failed++;
    return acc;
  }, {});
  
  console.log('\n📋 Results by content type:');
  Object.entries(typeBreakdown).forEach(([type, stats]) => {
    console.log(`   ${type}: ${stats.success} ✅ / ${stats.failed} ❌`);
  });
  
  if (failedCount > 0) {
    console.log('\n❌ Failed items:');
    migrationResults.filter(r => !r.success).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.type}: "${result.title}" - ${result.error}`);
    });
  }
  console.log('='.repeat(50));
  
  return migrationResults;
};