# Migration Service

The Migration Service handles the core content creation and asset migration operations. It provides the fundamental building blocks for creating pages, folders, and migrating attachments and comments between Confluence instances.

## Overview

The `migrationService.js` module contains the essential functions for creating content in the target Confluence instance and migrating associated assets like attachments and comments.

## Core Functions

### `createContent()`

**Purpose:** Creates pages or folders in the target Confluence instance using the appropriate API endpoints.

**Parameters:**
- `sourceContent` - Original content object from source instance
- `targetSpaceKey` - Target space key for content creation
- `sourceSpaceKey` - Source space key for reference
- `targetContentData` - Processed content data for target instance

**Features:**
- **API Version Handling:** Uses Confluence v2 API for optimal performance
- **Content Type Detection:** Automatically handles pages vs folders differently
- **Parent Relationship Preservation:** Maintains hierarchical structure
- **Timeout Protection:** 30-second timeout prevents hanging operations
- **Comprehensive Error Handling:** Detailed error reporting and fallback mechanisms

**API Endpoints:**
- **Pages:** `/wiki/api/v2/pages`
- **Folders:** `/wiki/api/v2/folders`

### `createFolderFallback()`

**Purpose:** Provides a fallback mechanism when folder creation fails by creating a page instead.

**Fallback Strategy:**
- Converts folder to a page with descriptive content
- Preserves hierarchy relationships
- Maintains original title and structure
- Marks content as converted for tracking purposes

### `migrateAttachments()`

**Purpose:** Migrates file attachments from source pages to target pages.

**Process Flow:**
1. **Discovery:** Retrieves all attachments from source page
2. **Download:** Downloads attachment data from source instance
3. **Upload:** Uploads attachment to target page using form data
4. **Validation:** Verifies successful attachment migration

**Features:**
- **Binary Data Handling:** Properly manages file streams and buffers
- **Form Data Creation:** Constructs multipart form data for uploads
- **Metadata Preservation:** Maintains original file names and properties
- **Error Recovery:** Continues migration even if individual attachments fail

### `migrateComments()`

**Purpose:** Migrates page comments from source to target pages.

**Process Flow:**
1. **Comment Discovery:** Retrieves all comments from source page
2. **Content Processing:** Extracts comment body and metadata
3. **Comment Creation:** Creates comments on target page using v2 API
4. **Validation:** Confirms successful comment migration

**Features:**
- **Rich Content Support:** Preserves comment formatting and storage format
- **Author Attribution:** Maintains original comment structure
- **Hierarchy Preservation:** Maintains comment threading where possible
- **Error Handling:** Continues migration despite individual comment failures

## Error Handling

### API Error Management
- **HTTP Status Codes:** Comprehensive status code handling (400, 401, 403, 404, 500, etc.)
- **Response Parsing:** Attempts to parse error responses for detailed information
- **Timeout Handling:** Prevents operations from hanging indefinitely
- **Retry Logic:** Built-in retry mechanisms for transient failures

### Fallback Mechanisms
- **Folder to Page Conversion:** When folder API fails, creates equivalent page
- **Content Format Adaptation:** Handles different content representations
- **API Version Fallback:** Can switch between API versions if needed

## Content Type Handling

### Pages
- **Rich Content Support:** Full storage format preservation
- **Metadata Migration:** Titles, status, and hierarchical relationships
- **Body Content:** Complete content migration with formatting
- **Parent Relationships:** Maintains page hierarchy structure

### Folders
- **Structure Preservation:** Maintains organizational structure
- **Hierarchy Mapping:** Preserves parent-child folder relationships
- **Fallback Support:** Converts to pages when folder API unavailable
- **Content Adaptation:** Adds descriptive content for converted folders

### Attachments
- **File Type Support:** All attachment types (images, documents, etc.)
- **Binary Handling:** Proper stream and buffer management
- **Size Management:** Handles large file attachments
- **Metadata Preservation:** Original filenames and properties

### Comments
- **Rich Text Support:** Preserves comment formatting
- **Threading Structure:** Maintains comment hierarchy where possible
- **Author Information:** Preserves original comment metadata
- **Timestamp Handling:** Manages comment creation timestamps

## Performance Considerations

### Optimization Features
- **Request Batching:** Efficient API call management
- **Memory Management:** Proper handling of large content and attachments
- **Stream Processing:** Efficient file handling for attachments
- **Timeout Management:** Prevents resource consumption from hanging operations

### Rate Limiting
- **API Throttling:** Respects Confluence API rate limits
- **Request Spacing:** Manages request frequency to prevent throttling
- **Error Recovery:** Handles rate limit exceeded errors gracefully
- **Progress Tracking:** Maintains migration progress during rate limiting

## File Location
`src/components/migrationService.js`

## Dependencies
- `@forge/api` - Forge platform API access
- `form-data` - For attachment upload handling

## Related Modules
- `migrationOrchestrator.js` - Coordinates migration workflow
- `contentService.js` - Provides content discovery
- `spaceService.js` - Manages space operations