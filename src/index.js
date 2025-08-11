import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import axios from 'axios';
import FormData from 'form-data';

const resolver = new Resolver();

// Source instance configuration (external API)
const SOURCE_CONFLUENCE_DOMAIN = 'forgeappdevdemo.atlassian.net';
const SOURCE_CONFLUENCE_USERNAME = 'user@example.com';
const SOURCE_CONFLUENCE_API_TOKEN = 'API_TOKEN';

// Target instance is the current Forge app instance (forgeappdevdemo.atlassian.net)

// Source instance API configuration (external API calls)
const createSourceAuthHeaders = () => {
  const auth = Buffer.from(`${SOURCE_CONFLUENCE_USERNAME}:${SOURCE_CONFLUENCE_API_TOKEN}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const sourceConfluenceAPI = axios.create({
  baseURL: `https://${SOURCE_CONFLUENCE_DOMAIN}/wiki/rest/api`,
  headers: createSourceAuthHeaders()
});

resolver.define('getText', (req) => {
  return `Connected to source Confluence instance: ${SOURCE_CONFLUENCE_DOMAIN}`;
});

resolver.define('testMigration', async (req) => {
  return {
    success: true,
    message: 'Test migration resolver is working',
    timestamp: new Date().toISOString()
  };
});

resolver.define('getSpaces', async (req) => {
  
  try {
    const response = await sourceConfluenceAPI.get('/space?limit=100&expand=description.plain,permissions');
    const spaces = response.data.results.map(space => ({
      id: space.id,
      name: space.name,
      key: space.key,
      description: space.description?.plain?.value || '',
      url: `https://${SOURCE_CONFLUENCE_DOMAIN}/wiki/spaces/${space.key}`,
      lastModified: space.history?.lastUpdated?.when || new Date().toISOString()
    }));
    return spaces;
  } catch (error) {
    console.error('Error fetching spaces - Status:', error.response?.status);
    console.error('Error fetching spaces - Data:', error.response?.data);
    console.error('Error fetching spaces - Message:', error.message);
    
    // Return mock data for testing
    return [
      {
        id: '131226',
        name: 'Confluence Migration Testing',
        key: 'CMT',
        description: 'Test space for migration',
        url: `https://${SOURCE_CONFLUENCE_DOMAIN}/wiki/spaces/CMT`,
        lastModified: new Date().toISOString()
      }
    ];
  }
});

resolver.define('getSpaceDetails', async (req) => {
  const { spaceKey } = req.payload;
  
  try {
    const response = await sourceConfluenceAPI.get(`/space/${spaceKey}?expand=description.plain,permissions`);
    return {
      success: true,
      space: {
        id: response.data.id,
        key: response.data.key,
        name: response.data.name,
        description: response.data.description?.plain?.value || '',
        type: response.data.type
      }
    };
  } catch (error) {
    console.error('Error fetching space details:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
});

resolver.define('countSpaceContent', async (req) => {
  const { spaceKey } = req.payload;
  
  try {
    // Get space details to obtain space name for filtering
    let spaceName = null;
    try {
      const spaceResponse = await sourceConfluenceAPI.get(`/space/${spaceKey}?expand=description.plain,permissions`);
      spaceName = spaceResponse.data.name;
    } catch (spaceError) {
      console.warn('Failed to get space details for filtering:', spaceError.message);
    }
    
    // Get all pages first
    const pagesResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${spaceKey}&type=page&limit=1000&expand=ancestors`);
    let pages = pagesResponse.data.results || [];
    
    // Filter out pages that match the space name
    if (spaceName) {
      const originalPageCount = pages.length;
      pages = pages.filter(page => {
        const pageTitle = page.title.toLowerCase().trim();
        const spaceNameLower = spaceName.toLowerCase().trim();
        const shouldExclude = pageTitle === spaceNameLower;
        
        if (shouldExclude) {
          console.log(`🚫 Excluding page "${page.title}" because it matches space name "${spaceName}"`);
        }
        return !shouldExclude;
      });
      if (originalPageCount !== pages.length) {
        console.log(`📋 Filtered ${originalPageCount - pages.length} pages that matched space name`);
      }
    }
    
    // Get all folders using CQL search (same method as migration)
    let folders = [];
    try {
      const foldersResponse = await sourceConfluenceAPI.get(`/content/search?cql=space=${spaceKey} AND type=folder&limit=1000&expand=ancestors`);
      folders = foldersResponse.data.results || [];
    } catch (folderError) {
      console.warn('Failed to fetch folders via CQL, trying alternative method:', folderError.message);
      try {
        const allContentResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${spaceKey}&limit=1000&expand=ancestors`);
        const allContent = allContentResponse.data.results || [];
        folders = allContent.filter(item => item.type === 'folder');
      } catch (fallbackError) {
        console.warn('Failed to fetch folders via fallback method:', fallbackError.message);
        folders = [];
      }
    }
    
    
    const rootPages = pages.filter(page => !page.ancestors || page.ancestors.length === 0);
    const childPages = pages.filter(page => page.ancestors && page.ancestors.length > 0);
    const rootFolders = folders.filter(folder => !folder.ancestors || folder.ancestors.length === 0);
    const childFolders = folders.filter(folder => folder.ancestors && folder.ancestors.length > 0);
    
    let totalAttachments = 0;
    let totalComments = 0;
    
    for (const page of pages) {
      try {
        const attachmentsResponse = await sourceConfluenceAPI.get(`/content/${page.id}/child/attachment`);
        totalAttachments += (attachmentsResponse.data.results || []).length;
        
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
    
    
    return {
      success: true,
      counts
    };
  } catch (error) {
    console.error('Error counting space content:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
});

resolver.define('createTargetSpace', async (req) => {
  const { key, name, description } = req.payload;
  console.log('Creating target space in destination instance:', key);
  
  try {
    const spaceData = {
      key: key,
      name: name,
      description: {
        plain: {
          value: description || '',
          representation: 'plain'
        }
      },
      type: 'global'
    };
    
    // Use Forge API to create space in destination instance
    const response = await api.asApp().requestConfluence(route`/wiki/api/v2/spaces`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spaceData)
    });
    
    if (response.ok) {
      const responseData = await response.json();
      return {
        success: true,
        space: {
          id: responseData.id,
          key: responseData.key,
          name: responseData.name
        }
      };
    } else {
      const errorData = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData}`
      };
    }
  } catch (error) {
    console.error('Error creating target space:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
});

resolver.define('migratePages', async (req) => {
  const { sourceSpaceKey, targetSpaceKey, pageIds } = req.payload;
  console.log('Migrating pages from', sourceSpaceKey, 'to', targetSpaceKey);
  
  const migrationResults = [];
  
  for (const pageId of pageIds) {
    try {
      const pageResponse = await confluenceAPI.get(`/content/${pageId}?expand=body.storage,ancestors,space`);
      const sourcePage = pageResponse.data;
      
      const targetPageData = {
        type: 'page',
        title: sourcePage.title,
        space: { key: targetSpaceKey },
        body: {
          storage: {
            value: sourcePage.body.storage.value,
            representation: 'storage'
          }
        }
      };
      
      if (sourcePage.ancestors && sourcePage.ancestors.length > 0) {
        const parentId = sourcePage.ancestors[sourcePage.ancestors.length - 1].id;
        const parentMapping = migrationResults.find(result => result.sourceId === parentId);
        if (parentMapping) {
          targetPageData.ancestors = [{ id: parentMapping.targetId }];
        }
      }
      
      const createResponse = await confluenceAPI.post('/content', targetPageData);
      
      const labelsResponse = await confluenceAPI.get(`/content/${pageId}/label`);
      if (labelsResponse.data.results.length > 0) {
        const labels = labelsResponse.data.results.map(label => ({ name: label.name }));
        await confluenceAPI.post(`/content/${createResponse.data.id}/label`, labels);
      }
      
      migrationResults.push({
        sourceId: pageId,
        targetId: createResponse.data.id,
        title: sourcePage.title,
        success: true
      });
      
    } catch (error) {
      console.error(`Error migrating page ${pageId}:`, error.response?.data || error.message);
      migrationResults.push({
        sourceId: pageId,
        success: false,
        error: error.response?.data?.message || error.message
      });
    }
  }
  
  return {
    success: true,
    results: migrationResults
  };
});

resolver.define('migrateAttachments', async (req) => {
  const { sourcePageId, targetPageId } = req.payload;
  console.log('Migrating attachments from page', sourcePageId, 'to', targetPageId);
  
  try {
    const attachmentsResponse = await confluenceAPI.get(`/content/${sourcePageId}/child/attachment`);
    const attachments = attachmentsResponse.data.results;
    
    const migrationResults = [];
    
    for (const attachment of attachments) {
      try {
        const downloadResponse = await confluenceAPI.get(attachment.download, { responseType: 'stream' });
        
        const formData = new FormData();
        formData.append('file', downloadResponse.data, attachment.title);
        formData.append('comment', 'Migrated attachment');
        
        const uploadResponse = await confluenceAPI.post(`/content/${targetPageId}/child/attachment`, formData, {
          headers: {
            ...createAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        });
        
        migrationResults.push({
          sourceId: attachment.id,
          targetId: uploadResponse.data.results[0].id,
          title: attachment.title,
          success: true
        });
        
      } catch (error) {
        console.error(`Error migrating attachment ${attachment.id}:`, error.message);
        migrationResults.push({
          sourceId: attachment.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      results: migrationResults
    };
  } catch (error) {
    console.error('Error migrating attachments:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
});

resolver.define('migrateComments', async (req) => {
  const { sourcePageId, targetPageId } = req.payload;
  console.log('Migrating comments from page', sourcePageId, 'to', targetPageId);
  
  try {
    const commentsResponse = await confluenceAPI.get(`/content/${sourcePageId}/child/comment`);
    const comments = commentsResponse.data.results;
    
    const migrationResults = [];
    
    for (const comment of comments) {
      try {
        const commentData = {
          type: 'comment',
          container: { id: targetPageId },
          body: {
            storage: {
              value: comment.body.storage.value,
              representation: 'storage'
            }
          }
        };
        
        const createResponse = await confluenceAPI.post('/content', commentData);
        
        migrationResults.push({
          sourceId: comment.id,
          targetId: createResponse.data.id,
          success: true
        });
        
      } catch (error) {
        console.error(`Error migrating comment ${comment.id}:`, error.message);
        migrationResults.push({
          sourceId: comment.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      results: migrationResults
    };
  } catch (error) {
    console.error('Error migrating comments:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
});

resolver.define('migrateSpace', async (req) => {
  const { sourceSpaceKey, sourceSpaceId, targetSpaceKey, targetSpaceName, targetSpaceDescription } = req.payload;
  
  try {
    
    // Step 1: Create target space
    console.log('📋 Step 1: Creating target space...');
    let spaceCreated = false;
    let spaceError = null;
    let targetSpaceId = null;
    
    try {
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
        targetSpaceId = responseData.id;
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
    
    // Step 2: Get folders and pages
    let folders = [];
    try {
      const foldersResponse = await sourceConfluenceAPI.get(`/content/search?cql=space=${sourceSpaceKey} AND type=folder&limit=1000&expand=ancestors`);
      folders = foldersResponse.data.results || [];
    } catch (folderError) {
      console.warn('Failed to fetch folders via CQL:', folderError.message);
      folders = [];
    }
    
    const pagesResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${sourceSpaceKey}&type=page&limit=1000&expand=ancestors,body.storage`);
    const allPages = pagesResponse.data.results || [];
    
    // Find and exclude the space home page (page with same title as space)
    const spaceDetails = await sourceConfluenceAPI.get(`/space/${sourceSpaceKey}`);
    const spaceName = spaceDetails.data.name;
    
    
    // Find pages that match space name (case-insensitive, trimmed)
    const spaceHomePages = allPages.filter(page => {
      const pageTitle = page.title.toLowerCase().trim();
      const spaceNameLower = spaceName.toLowerCase().trim();
      const isMatch = pageTitle === spaceNameLower;
      
      if (isMatch) {
        console.log(`🚫 Excluding page "${page.title}" because it matches space name "${spaceName}"`);
      }
      return isMatch;
    });
    
    const pages = allPages.filter(page => !spaceHomePages.some(homePage => homePage.id === page.id));
    
    if (spaceHomePages.length > 0) {
      console.log(`📄 Will migrate ${pages.length} pages (excluding ${spaceHomePages.length} space home page(s))`);
    }
    
    // Step 4: Migrate folders first, then pages
    let migratedCount = 0;
    let failedCount = 0;
    const migrationResults = [];
    
    // Create mappings to track migrated IDs for relationships
    const folderIdMapping = new Map();
    const pageIdMapping = new Map();
    
    if (spaceCreated) {
      // Step 4a: Migrate folders first
      if (folders.length > 0) {
        console.log(`📁 Starting migration of ${folders.length} folders`);
        
        // Sort folders to handle parent-child relationships (root folders first)
        const rootFolders = folders.filter(folder => !folder.ancestors || folder.ancestors.length === 0);
        const childFolders = folders.filter(folder => folder.ancestors && folder.ancestors.length > 0);
        const sortedFolders = [...rootFolders, ...childFolders];
        
        
        for (const folder of sortedFolders) {
          try {
            console.log(`📁 Migrating folder: ${folder.title} (ID: ${folder.id})`);
            
            const folderData = {
              spaceId: targetSpaceId,
              title: folder.title
            };
            
            // Handle parent-child relationships for folders
            if (folder.ancestors && folder.ancestors.length > 0) {
              const parentSourceId = folder.ancestors[folder.ancestors.length - 1].id;
              
              // Check if parent is a folder
              const parentTargetFolderId = folderIdMapping.get(parentSourceId);
              if (parentTargetFolderId) {
                folderData.parentId = parentTargetFolderId;
                console.log(`🔗 Setting folder parent relationship: ${folder.title} -> parent folder ID ${parentTargetFolderId}`);
              } else {
                // Parent might be a page, check page mapping
                const parentTargetPageId = pageIdMapping.get(parentSourceId);
                if (parentTargetPageId) {
                  folderData.parentId = parentTargetPageId;
                  console.log(`🔗 Setting folder parent relationship: ${folder.title} -> parent page ID ${parentTargetPageId}`);
                } else {
                  console.warn(`⚠️ Parent not found for folder ${folder.title}, creating as root folder`);
                }
              }
            }
            
            const createResponse = await api.asApp().requestConfluence(route`/wiki/api/v2/folders`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(folderData)
            });
            
            if (createResponse.ok) {
              const createdFolder = await createResponse.json();
              console.log(`✅ Folder migrated successfully: ${folder.title} (New ID: ${createdFolder.id})`);
              
              // Store the mapping for parent-child relationships
              folderIdMapping.set(folder.id, createdFolder.id);
              
              migratedCount++;
              migrationResults.push({
                sourceId: folder.id,
                targetId: createdFolder.id,
                title: folder.title,
                type: 'folder',
                success: true
              });
            } else {
              const errorText = await createResponse.text();
              console.log(`❌ Folder migration failed: ${folder.title} - ${createResponse.status}: ${errorText}`);
              failedCount++;
              migrationResults.push({
                sourceId: folder.id,
                title: folder.title,
                type: 'folder',
                success: false,
                error: `${createResponse.status}: ${errorText}`
              });
            }
          } catch (folderError) {
            console.log(`❌ Folder migration exception: ${folder.title} - ${folderError.message}`);
            failedCount++;
            migrationResults.push({
              sourceId: folder.id,
              title: folder.title,
              type: 'folder',
              success: false,
              error: folderError.message
            });
          }
        }
      } else {
      }
      
      // Step 4b: Migrate pages
      if (pages.length > 0) {
        console.log(`📄 Starting migration of ${pages.length} pages`);
        
        // Sort pages to handle parent-child relationships (root pages first)
        const rootPages = pages.filter(page => !page.ancestors || page.ancestors.length === 0);
        const childPages = pages.filter(page => page.ancestors && page.ancestors.length > 0);
        const sortedPages = [...rootPages, ...childPages];
        
        
        for (const page of sortedPages) {
          try {
            console.log(`📄 Migrating page: ${page.title} (ID: ${page.id})`);
            
            const pageData = {
              spaceId: targetSpaceId,
              status: 'current',
              title: page.title,
              body: {
                representation: 'storage',
                value: page.body?.storage?.value || '<p>Content could not be migrated</p>'
              }
            };
            
            // Handle parent-child relationships for v2 API
            if (page.ancestors && page.ancestors.length > 0) {
              const parentSourceId = page.ancestors[page.ancestors.length - 1].id;
              
              // Check if parent is a space home page (which we skip)
              if (spaceHomePages.some(homePage => homePage.id === parentSourceId)) {
                // Parent is space home page - create as direct child of space
                console.log(`📋 Page ${page.title} will be created as direct child of space (parent is space home page)`);
              } else {
                // Check if parent is a migrated page
                const parentTargetPageId = pageIdMapping.get(parentSourceId);
                if (parentTargetPageId) {
                  pageData.parentId = parentTargetPageId;
                  console.log(`🔗 Setting page parent relationship: ${page.title} -> parent page ID ${parentTargetPageId}`);
                } else {
                  // Check if parent is a migrated folder
                  const parentTargetFolderId = folderIdMapping.get(parentSourceId);
                  if (parentTargetFolderId) {
                    pageData.parentId = parentTargetFolderId;
                    console.log(`🔗 Setting page parent relationship: ${page.title} -> parent folder ID ${parentTargetFolderId}`);
                  } else {
                    // Parent not found in our mappings - create as direct child of space
                    console.log(`📋 Page ${page.title} will be created as direct child of space (parent not in migration scope)`);
                  }
                }
              }
            } else {
              // No ancestors - create as direct child of space
              console.log(`📋 Page ${page.title} will be created as direct child of space (root-level page)`);
            }
            
            const createResponse = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(pageData)
            });
            
            if (createResponse.ok) {
              const createdPage = await createResponse.json();
              console.log(`✅ Page migrated successfully: ${page.title} (New ID: ${createdPage.id})`);
              
              // Store the mapping for parent-child relationships
              pageIdMapping.set(page.id, createdPage.id);
              
              migratedCount++;
              migrationResults.push({
                sourceId: page.id,
                targetId: createdPage.id,
                title: page.title,
                type: 'page',
                success: true
              });
            } else {
              const errorText = await createResponse.text();
              console.log(`❌ Page migration failed: ${page.title} - ${createResponse.status}: ${errorText}`);
              failedCount++;
              migrationResults.push({
                sourceId: page.id,
                title: page.title,
                type: 'page',
                success: false,
                error: `${createResponse.status}: ${errorText}`
              });
            }
          } catch (pageError) {
            console.log(`❌ Page migration exception: ${page.title} - ${pageError.message}`);
            failedCount++;
            migrationResults.push({
              sourceId: page.id,
              title: page.title,
              type: 'page',
              success: false,
              error: pageError.message
            });
          }
        }
      } else {
      }
    } else {
      console.log('❌ Skipping migration because space creation failed');
    }
    
    // Final result
    console.log('🎉 Migration completed');
    console.log(`📊 Results: Space created: ${spaceCreated}, Pages migrated: ${migratedCount}, Failed: ${failedCount}`);
    
    return {
      success: true,
      message: `Migration completed. Space: ${spaceCreated ? 'Created' : 'Failed'}, Pages: ${migratedCount}/${pages.length}`,
      sourceSpaceKey,
      targetSpaceKey,
      spaceCreated,
      spaceError,
      migrationResults,
      counts: {
        totalPages: pages.length,
        totalFolders: folders.length,
        totalItems: pages.length + folders.length,
        migratedCount,
        failedCount
      }
    };
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('❌ Space migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

export const handler = resolver.getDefinitions();
