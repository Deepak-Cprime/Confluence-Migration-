const api = require('@forge/api').default;
const { route } = require('@forge/api');

// Space management operations
const createTargetSpace = async (key, name, description) => {
  
  try {
    const spaceData = {
      key: key,
      name: name,
      description: description || '',
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
};

const getSpaceDetails = async (sourceConfluenceAPI, spaceKey) => {
  
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
};

module.exports = {
  createTargetSpace,
  getSpaceDetails
};