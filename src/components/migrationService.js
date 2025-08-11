import api, { route } from '@forge/api';

// Content creation operations
export const createContent = async (sourceContent, targetSpaceKey, sourceSpaceKey, targetContentData) => {
  console.log(`🔧 Making API call to create ${sourceContent.type}...`);
  
  // Use appropriate API endpoint and data structure based on content type
  let apiEndpoint, requestBody;
  
  if (sourceContent.type === 'folder') {
    // Folders use the v1 API content endpoint with correct format
    apiEndpoint = route`/wiki/rest/api/content`;
    requestBody = {
      type: 'folder',
      title: `[MIGRATED] ${sourceContent.title}`,
      space: { key: targetSpaceKey || sourceSpaceKey },
      body: {
        storage: {
          value: sourceContent.body?.storage?.value || "",
          representation: 'storage'
        }
      },
      ...((sourceContent.ancestors && sourceContent.ancestors.length > 0 && targetContentData.ancestors) ? 
         { ancestors: targetContentData.ancestors } : {})
    };
  } else {
    // Pages can use either v1 or v2 API, let's stick with v1 for consistency
    apiEndpoint = route`/wiki/rest/api/content`;
    requestBody = {
      type: 'page',
      title: `[MIGRATED] ${sourceContent.title}`,
      space: { key: targetSpaceKey || sourceSpaceKey }, // Use key for v1 API
      body: targetContentData.body,
      ...((sourceContent.ancestors && sourceContent.ancestors.length > 0 && targetContentData.ancestors) ? 
         { ancestors: targetContentData.ancestors } : {})
    };
  }
  
  console.log(`🔗 API Endpoint: ${apiEndpoint}`);
  console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
  
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API call timed out after 30 seconds')), 30000);
    });
    
    const apiPromise = api.asApp().requestConfluence(apiEndpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const createResponse = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log(`📡 API Response Status: ${createResponse.status}`);
    console.log(`📡 API Response OK: ${createResponse.ok}`);
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`❌ Failed to create ${sourceContent.type}: ${createResponse.status}`);
      console.error(`❌ Error response: ${errorText}`);
      console.error(`❌ Failed request body was:`, JSON.stringify(requestBody, null, 2));
      
      // Try to parse error as JSON for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`❌ Parsed error details:`, errorJson);
      } catch (parseError) {
        console.error(`❌ Could not parse error response as JSON`);
      }
      
      throw new Error(`Failed to create ${sourceContent.type}: ${createResponse.status} ${errorText}`);
    }
    
    var createResponseData = await createResponse.json();
    console.log(`✅ Successfully created ${sourceContent.type}: "${sourceContent.title}" with ID: ${createResponseData.id}`);
    console.log(`📄 Created content details:`, {
      id: createResponseData.id,
      type: createResponseData.type,
      title: createResponseData.title,
      status: createResponseData.status
    });
    
    return createResponseData;
    
  } catch (apiError) {
    console.error(`🔥 API Call Exception for ${sourceContent.type} "${sourceContent.title}":`, apiError);
    console.error(`🔥 Error stack:`, apiError.stack);
    
    // For folders, try a fallback approach or skip if it's not critical
    if (sourceContent.type === 'folder') {
      console.warn(`⚠️ Folder creation failed, attempting fallback approach...`);
      
      return await createFolderFallback(sourceContent, targetSpaceKey, sourceSpaceKey, targetContentData);
    } else {
      throw apiError; // For pages, don't use fallback
    }
  }
};

// Fallback mechanism for folder creation
const createFolderFallback = async (sourceContent, targetSpaceKey, sourceSpaceKey, targetContentData) => {
  try {
    const fallbackRequestBody = {
      type: 'page',
      title: `[MIGRATED-FOLDER] ${sourceContent.title}`,
      space: { key: targetSpaceKey || sourceSpaceKey },
      body: {
        storage: {
          value: `<p><strong>This was originally a folder: ${sourceContent.title}</strong></p><p>Content from the original folder has been migrated below.</p>`,
          representation: 'storage'
        }
      },
      ...((sourceContent.ancestors && sourceContent.ancestors.length > 0 && targetContentData.ancestors) ? 
         { ancestors: targetContentData.ancestors } : {})
    };
    
    console.log(`🔄 Trying fallback: create as page instead of folder`);
    const fallbackResponse = await api.asApp().requestConfluence(route`/wiki/rest/api/content`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fallbackRequestBody)
    });
    
    if (fallbackResponse.ok) {
      const createResponseData = await fallbackResponse.json();
      console.log(`✅ Fallback successful: Created as page with ID: ${createResponseData.id}`);
      console.log(`📄 Fallback content details:`, {
        id: createResponseData.id,
        type: createResponseData.type,
        title: createResponseData.title,
        status: createResponseData.status
      });
      
      // Mark that we used fallback for tracking
      createResponseData.wasFallback = true;
      createResponseData.originalType = 'folder';
      
      return createResponseData;
    } else {
      const fallbackErrorText = await fallbackResponse.text();
      console.error(`❌ Fallback failed: ${fallbackResponse.status} ${fallbackErrorText}`);
      throw new Error(`Both folder and fallback page creation failed: ${fallbackErrorText}`);
    }
  } catch (fallbackError) {
    console.error(`❌ Fallback also failed:`, fallbackError);
    throw fallbackError;
  }
};

// Migrate attachments for a page
export const migrateAttachments = async (sourceConfluenceAPI, sourcePageId, targetPageId) => {
  console.log('Migrating attachments from page', sourcePageId, 'to', targetPageId);
  
  try {
    const attachmentsResponse = await sourceConfluenceAPI.get(`/content/${sourcePageId}/child/attachment`);
    const attachments = attachmentsResponse.data.results || [];
    
    const migrationResults = [];
    
    for (const attachment of attachments) {
      try {
        console.log(`📎 Migrating attachment: ${attachment.title}`);
        
        // Download attachment from source
        const downloadUrl = `${attachment._links.download}`;
        const downloadResponse = await sourceConfluenceAPI.get(downloadUrl, { 
          responseType: 'arraybuffer'
        });
        
        // Create form data for upload to destination
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', Buffer.from(downloadResponse.data), attachment.title);
        formData.append('comment', 'Migrated attachment');
        
        // Upload to destination using Forge API
        const uploadResponse = await api.asApp().requestConfluence(route`/wiki/rest/api/content/${targetPageId}/child/attachment`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          console.log(`✅ Attachment migrated: ${attachment.title}`);
        } else {
          console.warn(`❌ Failed to upload attachment ${attachment.title}: ${uploadResponse.status}`);
        }
      } catch (attachError) {
        console.warn(`❌ Failed to migrate attachment ${attachment.title}:`, attachError.message);
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
};

// Migrate comments for a page
export const migrateComments = async (sourceConfluenceAPI, sourcePageId, targetPageId) => {
  console.log('Migrating comments from page', sourcePageId, 'to', targetPageId);
  
  try {
    const commentsResponse = await sourceConfluenceAPI.get(`/content/${sourcePageId}/child/comment`);
    const comments = commentsResponse.data.results || [];
    
    const migrationResults = [];
    
    for (const comment of comments) {
      try {
        console.log(`💬 Migrating comment by ${comment.history?.createdBy?.displayName}`);
        
        // Create comment data for destination
        const commentData = {
          type: 'comment',
          container: { id: targetPageId },
          body: {
            storage: {
              value: comment.body?.storage?.value || comment.body?.value || '',
              representation: 'storage'
            }
          }
        };
        
        // Create comment in destination using Forge API
        const commentResponse = await api.asApp().requestConfluence(route`/wiki/rest/api/content`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(commentData)
        });
        
        if (commentResponse.ok) {
          console.log(`✅ Comment migrated successfully`);
        } else {
          console.warn(`❌ Failed to create comment: ${commentResponse.status}`);
        }
      } catch (commentError) {
        console.warn(`❌ Failed to migrate comment:`, commentError.message);
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
};