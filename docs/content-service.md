# Content Service

The Content Service handles content discovery, counting, and organization operations. It provides intelligent content filtering, hierarchy management, and comprehensive content analysis for the migration process.

## Overview

The `contentService.js` module is responsible for discovering and organizing content from the source Confluence space, including sophisticated filtering mechanisms and dependency resolution for maintaining content hierarchy.

## Core Functions

### `getAllSpaceContent()`

**Purpose:** Retrieves all content (pages and folders) from a source space with intelligent filtering and dependency resolution.

**Parameters:**
- `sourceConfluenceAPI` - Configured axios instance for source Confluence
- `spaceKey` - Key of the space to analyze
- `spaceName` - Optional space name for filtering (defaults to null)

**Features:**
- **Complete Content Discovery:** Retrieves all pages and folders from source space
- **Dependency Resolution:** Automatically fetches missing parent dependencies
- **Smart Filtering:** Excludes space home pages that exactly match space name
- **Hierarchy Preservation:** Maintains parent-child relationships
- **Fallback Mechanisms:** Multiple strategies for folder discovery

**Process Flow:**
1. **Page Discovery:** Retrieves all pages with ancestors and body content
2. **Folder Discovery:** Uses CQL search with fallback methods
3. **Dependency Analysis:** Identifies missing parent dependencies
4. **Parent Resolution:** Fetches missing parents to ensure complete hierarchy
5. **Content Filtering:** Applies space home page filtering
6. **Final Validation:** Returns organized content arrays

**Return Value:**
```json
{
  "pages": [/* Array of page objects */],
  "folders": [/* Array of folder objects */]
}
```

### `countSpaceContent()`

**Purpose:** Analyzes and counts all content types in a source space for migration planning.

**Parameters:**
- `sourceConfluenceAPI` - Configured axios instance for source Confluence
- `spaceKey` - Key of the space to analyze
- `spaceName` - Optional space name for filtering

**Content Analysis:**
- **Pages:** Total pages, root pages, child pages
- **Folders:** Total folders, root folders, child folders  
- **Attachments:** Total attachments across all pages
- **Comments:** Total comments across all pages
- **Hierarchy Analysis:** Parent-child relationship mapping

**Return Value:**
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
  "error": "error-message" // Only present on failure
}
```

### `filterPagesBySpaceName()`

**Purpose:** Filters out space home pages that exactly match the space name to avoid duplicate content.

**Parameters:**
- `pages` - Array of page objects to filter
- `spaceName` - Space name to match against

**Filtering Logic:**
- **Exact Match Only:** Only excludes pages with titles exactly matching space name
- **Case Insensitive:** Performs case-insensitive comparison
- **Whitespace Handling:** Trims whitespace before comparison
- **Detailed Logging:** Reports which pages are excluded and why

**Features:**
- **Conservative Approach:** Only excludes obvious space home pages
- **Transparency:** Clear logging of filtering decisions
- **Fallback Safety:** Includes all pages if no space name provided
- **Count Tracking:** Reports number of pages filtered

### `fetchMissingParents()`

**Purpose:** Identifies and retrieves missing parent dependencies to ensure complete content hierarchy.

**Parameters:**
- `sourceConfluenceAPI` - Configured axios instance for source Confluence
- `allContent` - Array of all discovered content

**Dependency Resolution:**
1. **Missing Identification:** Finds referenced parent IDs not in content set
2. **Parent Fetching:** Retrieves missing parent content from source
3. **Error Handling:** Manages failures in parent fetching
4. **Hierarchy Completion:** Returns missing parents for inclusion

**Features:**
- **Complete Hierarchy:** Ensures all parent dependencies are available
- **Error Recovery:** Continues migration even if some parents cannot be fetched
- **Detailed Logging:** Reports which parents are missing and fetched
- **Performance Optimization:** Efficient parent lookup and retrieval

## Content Discovery Strategies

### Page Discovery
- **Primary Method:** Standard Confluence API for pages
- **Expansion Options:** Includes ancestors and body content
- **Batch Processing:** Retrieves up to 1000 pages per request
- **Hierarchy Information:** Maintains parent-child relationships

**API Endpoint:** `/content?spaceKey={key}&type=page&limit=1000&expand=ancestors,body.storage`

### Folder Discovery
- **Primary Method:** CQL (Confluence Query Language) search
- **Fallback Method 1:** Standard content API with type filtering
- **Fallback Method 2:** Manual filtering of all content types
- **Error Recovery:** Multiple strategies ensure folder discovery

**API Endpoints:**
- **Primary:** `/content/search?cql=space={key} AND type=folder&limit=1000&expand=ancestors,body.storage`
- **Fallback:** `/content?spaceKey={key}&limit=1000&expand=ancestors,body.storage`

### Content Organization
- **Root Content:** Items with no ancestors (top-level)
- **Child Content:** Items with one or more ancestors
- **Type Separation:** Pages and folders handled separately
- **Hierarchy Mapping:** Parent-child relationships preserved

## Filtering Mechanisms

### Space Home Page Filtering
- **Purpose:** Prevents migration of automatically generated space home pages
- **Criteria:** Pages with titles exactly matching space name
- **Scope:** Only affects pages, not folders
- **Safety:** Conservative approach to avoid excluding valid content

### Content Type Filtering
- **Pages:** Standard Confluence pages with content
- **Folders:** Organizational folders (when supported)
- **Exclusions:** System pages, templates, and auto-generated content
- **Customizable:** Filtering rules can be adjusted based on requirements

## Performance Optimization

### Batch Processing
- **Large Requests:** Retrieves up to 1000 items per API call
- **Efficient Expansion:** Only expands necessary content fields
- **Memory Management:** Efficient handling of large content sets
- **Request Optimization:** Minimizes number of API calls required

### Caching Strategies
- **Content Mapping:** Efficient lookup structures for content relationships
- **Dependency Caching:** Caches parent-child relationships
- **API Response Caching:** Temporary caching of API responses
- **Memory Optimization:** Efficient memory usage for large spaces

## File Location
`src/components/contentService.js`

## Dependencies
None (pure service module)

## Related Modules
- `migrationOrchestrator.js` - Uses content service for content discovery
- `migrationService.js` - Consumes content structure for migration
- `index.js` - Main resolver that calls content counting functions