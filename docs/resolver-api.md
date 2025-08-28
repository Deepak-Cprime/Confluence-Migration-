# Resolver API

The Resolver API provides the main interface for the Confluence Migration Forge application. It defines all the available resolver functions that can be called from the frontend interface.

## Overview

The `index.js` file contains the main Forge resolver definitions that handle API requests from the frontend. It serves as the entry point for all migration operations and provides a clean interface between the frontend and backend services.

## Configuration

### Source Instance Configuration
The resolver is configured with source Confluence instance credentials:
- **Domain:** Configurable source domain
- **Username:** Email-based authentication
- **API Token:** Atlassian API token for authentication
- **Base URL:** Constructed from domain for API calls

### API Client Setup
```javascript
const sourceConfluenceAPI = axios.create({
  baseURL: `https://${SOURCE_CONFLUENCE_DOMAIN}/wiki/rest/api`,
  headers: createSourceAuthHeaders()
});
```

## Available Resolvers

### `getText`

**Purpose:** Simple connectivity test for the application.

**Parameters:** None

**Returns:** Connection status message

**Usage:** Initial application load and connectivity verification

### `testMigration`

**Purpose:** Tests the migration resolver functionality.

**Parameters:** None

**Returns:**
```json
{
  "success": true,
  "message": "Test migration resolver is working",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Usage:** Verifying resolver functionality before actual migration

### `getSpaces`

**Purpose:** Retrieves all available spaces from the source Confluence instance.

**Parameters:** None

**Returns:** Array of space objects with details:
```json
[
  {
    "id": "space-id",
    "name": "Space Name",
    "key": "SPACE-KEY",
    "description": "Space description",
    "url": "https://domain.atlassian.net/wiki/spaces/KEY",
    "lastModified": "2024-01-01T00:00:00.000Z"
  }
]
```

**Features:**
- **Error Handling:** Returns mock data if API fails
- **URL Generation:** Constructs proper space URLs
- **Metadata Extraction:** Includes space description and modification dates
- **Pagination Support:** Retrieves up to 100 spaces per request

### `getSpaceDetails`

**Purpose:** Retrieves detailed information about a specific space.

**Parameters:**
```json
{
  "spaceKey": "SPACE-KEY"
}
```

**Returns:**
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
  "error": "error-message" // Only on failure
}
```

**Usage:** Getting space information before migration planning

### `countSpaceContent`

**Purpose:** Analyzes and counts all content in a source space for migration planning.

**Parameters:**
```json
{
  "spaceKey": "SPACE-KEY"
}
```

**Returns:**
```json
{
  "success": true|false,
  "counts": {
    "totalPages": 0,
    "totalFolders": 0,
    "rootPages": 0,
    "childPages": 0,
    "rootFolders": 0,
    "childFolders": 0,
    "totalAttachments": 0,
    "totalComments": 0,
    "totalItems": 0
  },
  "error": "error-message" // Only on failure
}
```

**Features:**
- **Complete Analysis:** Counts all content types
- **Hierarchy Breakdown:** Separates root and child content
- **Asset Counting:** Includes attachments and comments
- **Filtering Integration:** Applies space home page filtering
- **Error Recovery:** Continues counting despite individual item failures

### `createTargetSpace`

**Purpose:** Creates a new space in the target Confluence instance.

**Parameters:**
```json
{
  "key": "TARGET-KEY",
  "name": "Target Space Name",
  "description": "Optional description"
}
```

**Returns:**
```json
{
  "success": true|false,
  "space": {
    "id": "space-id",
    "key": "space-key",
    "name": "space-name"
  },
  "error": "error-message" // Only on failure
}
```

**Features:**
- **Forge API Integration:** Uses Forge API for target instance access
- **v2 API Support:** Uses modern Confluence API
- **Validation:** Ensures space creation success
- **Error Handling:** Detailed error reporting for failures

### `migrateSpace`

**Purpose:** Performs complete space migration from source to target instance.

**Parameters:**
```json
{
  "sourceSpaceKey": "SOURCE-KEY",
  "sourceSpaceId": "source-space-id",
  "targetSpaceKey": "TARGET-KEY",
  "targetSpaceName": "Target Space Name",
  "targetSpaceDescription": "Optional description"
}
```

**Returns:**
```json
{
  "success": true|false,
  "message": "Migration status message",
  "sourceSpaceKey": "source-key",
  "targetSpaceKey": "target-key",
  "spaceCreated": true|false,
  "spaceError": "space-creation-error", // Optional
  "migrationResults": [/* Array of migration results */],
  "counts": {/* Content counts */},
  "enhancedFeatures": {
    "dependencyTreeSorting": true,
    "retryLogic": true,
    "hierarchyValidation": true,
    "improvedSpaceFiltering": true
  },
  "error": "error-message" // Only on failure
}
```

**Features:**
- **Complete Migration:** Full space migration with all content types
- **Enhanced Orchestration:** Uses advanced migration orchestrator
- **Progress Reporting:** Detailed migration progress and results
- **Error Management:** Comprehensive error handling and reporting
- **Validation:** Post-migration hierarchy validation

## Authentication

### Source Instance Authentication
- **Method:** Basic Authentication with API Token
- **Headers:** Automatically generated authentication headers
- **Security:** API tokens provide secure access without passwords
- **Scope:** Read access to source Confluence instance

### Target Instance Authentication
- **Method:** Forge App Authentication
- **API:** Uses Forge `api.asApp()` for authenticated requests
- **Permissions:** Full access to target instance as Forge app
- **Security:** Forge platform handles authentication automatically

## Error Handling

### API Error Management
- **Source API Errors:** Comprehensive error handling for external API calls
- **Target API Errors:** Forge API error handling and reporting
- **Network Issues:** Timeout and connectivity error management
- **Authentication Failures:** Clear error messages for auth issues

### Response Formatting
- **Consistent Structure:** All resolvers return consistent response format
- **Success Indicators:** Clear success/failure flags
- **Error Details:** Detailed error messages for troubleshooting
- **Context Information:** Additional context for error resolution

## Performance Considerations

### Request Optimization
- **Batch Processing:** Efficient handling of large data sets
- **Connection Reuse:** Leverages axios and Forge API connection pooling
- **Timeout Management:** Appropriate timeouts for long-running operations
- **Memory Management:** Efficient memory usage for large migrations

### Rate Limiting
- **API Throttling:** Respects Confluence API rate limits
- **Request Spacing:** Manages request frequency to prevent throttling
- **Error Recovery:** Handles rate limit exceeded scenarios
- **Progress Management:** Maintains progress during rate limiting

## File Location
`src/index.js`

## Dependencies
- `@forge/resolver` - Forge resolver framework
- `@forge/api` - Forge platform API access
- `axios` - HTTP client for external API calls
- `form-data` - For attachment handling
- `./components/migrationOrchestrator.js` - Main migration orchestrator

## Export
The resolver definitions are exported as the handler for the Forge application:
```javascript
export const handler = resolver.getDefinitions();
```