# Migration Orchestrator

The Migration Orchestrator is the main coordinator for the Confluence space migration process. It manages the entire migration workflow from source to target Confluence instances.

## Overview

The `migrationOrchestrator.js` module orchestrates the complete migration process, ensuring proper sequencing, dependency management, and error handling throughout the migration lifecycle.

## Core Functions

### `performFullSpaceMigration()`

**Purpose:** Executes a complete space migration from source to target Confluence instance.

**Parameters:**
- `sourceConfluenceAPI` - Axios instance configured for source Confluence
- `sourceSpaceKey` - Key of the source space to migrate
- `sourceSpaceId` - ID of the source space 
- `targetSpaceKey` - Key for the new target space
- `targetSpaceName` - Display name for the target space
- `targetSpaceDescription` - Description for the target space

**Process Flow:**

1. **Space Analysis**
   - Retrieves source space details
   - Extracts space name for content filtering

2. **Target Space Creation**
   - Creates target space using Forge API
   - Validates space creation success
   - Stores space ID for content creation

3. **Content Discovery**
   - Fetches all pages and folders from source space
   - Filters out space home pages that match space name
   - Counts attachments and comments

4. **Migration Execution**
   - Builds dependency tree for proper migration order
   - Migrates content with parent-child relationships
   - Includes retry logic for dependency-related failures

5. **Validation**
   - Validates migrated content hierarchy
   - Generates comprehensive migration report

### `buildDependencyTree()`

**Purpose:** Creates a proper dependency-ordered list for migration to ensure parents are migrated before children.

**Algorithm:**
- Maps all content by ID for quick lookup
- Recursively processes dependencies
- Ensures ancestors are migrated before descendants
- Prevents circular dependency issues

### `migrateContentInOrder()`

**Purpose:** Executes the actual content migration following dependency order.

**Features:**
- **Progress Tracking:** Real-time migration progress with detailed logging
- **Parent Relationship Handling:** Maintains hierarchical structure in target
- **Error Management:** Comprehensive error handling and retry mechanisms
- **Content Type Support:** Handles pages, folders, attachments, and comments
- **Fallback Strategies:** Alternative approaches when primary methods fail

### `validateMigrationHierarchy()`

**Purpose:** Post-migration validation to ensure content hierarchy integrity.

**Validation Checks:**
- Verifies parent-child relationships are preserved
- Identifies orphaned content
- Detects hierarchy mismatches
- Generates validation report with success rates

## Migration Flow

```
Source Space Analysis
        ↓
Target Space Creation
        ↓
Content Discovery & Filtering
        ↓
Dependency Tree Building
        ↓
Sequential Content Migration
        ↓
Retry Failed Migrations
        ↓
Hierarchy Validation
        ↓
Final Report Generation
```

## Error Handling

### Retry Logic
- **Dependency Failures:** Up to 3 retry attempts for items with missing parents
- **API Timeouts:** 30-second timeout with appropriate error messages
- **Space Creation Failures:** Blocks migration if target space cannot be created

### Failure Recovery
- **Partial Success Handling:** Continues migration even if some items fail
- **Detailed Error Logging:** Comprehensive error tracking for troubleshooting
- **Fallback Mechanisms:** Alternative approaches for content creation

## Performance Features

- **Batch Processing:** Efficient handling of large content sets
- **Dependency Optimization:** Smart ordering reduces retry needs
- **Progress Reporting:** Real-time status updates
- **Memory Management:** Efficient data structures for large migrations

## File Location
`src/components/migrationOrchestrator.js`

## Dependencies
- `@forge/api` - Forge platform API access
- `contentService.js` - Content discovery and management
- `migrationService.js` - Content creation and asset migration
- `spaceService.js` - Space management operations