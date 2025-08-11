// Content counting and organization operations

// Filter function to exclude pages where page name matches space name
const filterPagesBySpaceName = (pages, spaceName) => {
  if (!spaceName) {
    return pages;
  }
  
  const filteredPages = pages.filter(page => {
    const pageTitle = page.title.toLowerCase().trim();
    const spaceNameLower = spaceName.toLowerCase().trim();
    const shouldExclude = pageTitle === spaceNameLower;
    
    if (shouldExclude) {
      console.log(`🚫 Excluding page "${page.title}" because it matches space name "${spaceName}"`);
    }
    return !shouldExclude;
  });
  
  return filteredPages;
};

export const countSpaceContent = async (sourceConfluenceAPI, spaceKey, spaceName = null) => {
  
  try {
    // Get all pages first
    const pagesResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${spaceKey}&type=page&limit=1000&expand=ancestors`);
    let pages = pagesResponse.data.results || [];
    // Filter out pages that match the space name
    pages = filterPagesBySpaceName(pages, spaceName);
    
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
};

export const getAllSpaceContent = async (sourceConfluenceAPI, spaceKey, spaceName = null) => {
  // Get all pages first
  const pagesResponse = await sourceConfluenceAPI.get(`/content?spaceKey=${spaceKey}&type=page&limit=1000&expand=ancestors`);
  let pages = pagesResponse.data.results || [];
  
  // Filter out pages that match the space name
  pages = filterPagesBySpaceName(pages, spaceName);
  
  // Get all folders using CQL search (more reliable for folders)
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
  
  return { pages, folders };
};