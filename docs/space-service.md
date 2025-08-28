# Space Service

The Space Service manages Confluence space operations, including creating target spaces and retrieving space information. It handles both v1 and v2 Confluence API interactions for space management.

## Overview

The `spaceService.js` module provides essential space management functionality for the migration process, focusing on target space creation and source space analysis.

## Core Functions

### `createTargetSpace()`

**Purpose:** Creates a new Confluence space in the target instance for migration.

**Parameters:**
- `key` - Unique space key for the new space
- `name` - Display name for the space
- `description` - Optional space description

**Features:**
- **API Version Flexibility:** Tries v2 API first, falls back to v1 API
- **Comprehensive Error Handling:** Detailed error reporting and logging
- **Response Validation:** Ensures space creation success with proper ID return
- **Fallback Strategy:** Automatic fallback between API versions

**API Endpoints:**
- **Primary:** `/wiki/api/v2/spaces` (v2 API)
- **Fallback:** `/wiki/rest/api/space` (v1 API)

**Return Value:**
```json
{
  "success": true|false,
  "space": {
    "id": "space-id",
    "key": "space-key", 
    "name": "space-name"
  },
  "error": "error-message" // Only present on failure
}
```

### `getSpaceDetails()`

**Purpose:** Retrieves detailed information about a source space.

**Parameters:**
- `sourceConfluenceAPI` - Configured axios instance for source Confluence
- `spaceKey` - Key of the space to retrieve

**Features:**
- **Complete Space Information:** Retrieves all essential space metadata
- **Permission Expansion:** Includes space permissions information
- **Description Handling:** Properly processes space descriptions
- **Error Management:** Comprehensive error handling for API failures

**Return Value:**
```json
{
  "success": true|false,
  "space": {
    "id": "space-id",
    "key": "space-key",
    "name": "space-name",
    "description": "space-description",
    "type": "space-type"
  },
  "error": "error-message" // Only present on failure
}
```

## Space Creation Process

### API Version Strategy

1. **v2 API Attempt**
   - Uses modern Confluence v2 API
   - Provides better performance and features
   - Preferred method for space creation

2. **v1 API Fallback**
   - Falls back to v1 API if v2 fails
   - Ensures compatibility with older instances
   - Maintains same request structure

3. **Error Handling**
   - Comprehensive logging of both attempts
   - Clear error messages for troubleshooting
   - Proper error propagation to calling functions

### Validation Features

- **Response Validation:** Ensures API returns proper space data
- **ID Verification:** Confirms space ID is present in response
- **Status Code Checking:** Validates HTTP response status codes
- **Error Message Parsing:** Extracts detailed error information from responses

## Error Handling

### API Error Management
- **HTTP Status Codes:** Handles all common HTTP error codes
- **Response Parsing:** Attempts to parse error responses as JSON
- **Fallback Logic:** Automatic API version fallback on failure
- **Error Logging:** Comprehensive error information for debugging

### Common Error Scenarios
- **Duplicate Space Key:** Space key already exists
- **Permission Errors:** Insufficient permissions to create space
- **Invalid Space Data:** Malformed space creation requests
- **API Connectivity:** Network or API endpoint issues
- **Authentication Failures:** Invalid or expired credentials

## Integration Points

### Migration Orchestrator
- **Space Creation Dependency:** Migration requires successful space creation
- **Space ID Provision:** Provides space ID for content creation
- **Error Propagation:** Passes creation errors to orchestrator
- **Status Reporting:** Reports space creation success/failure

### Content Services
- **Space Validation:** Validates source space existence
- **Metadata Provision:** Provides space information for filtering
- **Context Information:** Supplies space context for content operations

## Performance Considerations

### API Optimization
- **Single Request:** Efficient space creation with single API call
- **Minimal Payload:** Lightweight request structures
- **Fast Fallback:** Quick detection and fallback between API versions
- **Connection Reuse:** Leverages Forge API connection pooling

### Error Recovery
- **Quick Failure Detection:** Fast identification of API version issues
- **Automatic Fallback:** Seamless transition between API versions
- **Efficient Error Handling:** Minimal overhead for error processing
- **Resource Cleanup:** Proper cleanup of failed requests

## File Location
`src/components/spaceService.js`

## Dependencies
- `@forge/api` - Forge platform API access

## Related Modules
- `migrationOrchestrator.js` - Uses space service for target space creation
- `index.js` - Main resolver that calls space service functions
- `contentService.js` - Uses space information for content filtering