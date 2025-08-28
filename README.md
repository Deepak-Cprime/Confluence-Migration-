# Confluence Migration Tool

A comprehensive Atlassian Forge application for migrating Confluence spaces between instances with intelligent content handling, hierarchy preservation, and advanced error recovery mechanisms.

## Overview

This application provides a complete solution for migrating Confluence spaces from a source instance to a target instance. It handles pages, folders, attachments, comments, and maintains parent-child relationships while providing detailed progress tracking and error management.

## Key Features

- **Complete Space Migration:** Full migration of pages, folders, attachments, and comments
- **Hierarchy Preservation:** Maintains parent-child relationships and content structure
- **Intelligent Filtering:** Automatically excludes space home pages and system content
- **Dependency Resolution:** Automatically resolves missing parent dependencies
- **Advanced Error Handling:** Comprehensive retry logic and fallback mechanisms
- **Real-time Progress Tracking:** Live migration progress with detailed logging
- **Post-Migration Validation:** Validates content hierarchy and relationships
- **React Frontend:** User-friendly interface for managing migrations

## Architecture

The application is structured into modular components, each handling specific aspects of the migration process:

### 📋 [Resolver API](docs/resolver-api.md)
Main API interface providing resolver functions for frontend communication. Handles authentication, request routing, and response formatting.

**Key Functions:**
- `getSpaces()` - Discover available source spaces
- `countSpaceContent()` - Analyze migration scope
- `migrateSpace()` - Execute complete migration
- `createTargetSpace()` - Create target spaces

### 🎯 [Migration Orchestrator](docs/migration-orchestrator.md)
Central coordinator managing the complete migration workflow with dependency tree building, retry logic, and validation.

**Core Capabilities:**
- Complete migration workflow management
- Dependency tree construction for proper ordering
- Retry mechanisms for failed migrations
- Post-migration hierarchy validation
- Comprehensive progress reporting

### 🔧 [Migration Service](docs/migration-service.md)
Core content creation and asset migration operations using Confluence APIs.

**Migration Operations:**
- Page and folder creation with v2 API support
- Attachment migration with binary data handling
- Comment migration with formatting preservation
- Fallback mechanisms for API failures

### 🏢 [Space Service](docs/space-service.md)
Space management operations including creation and information retrieval.

**Space Operations:**
- Target space creation with v1/v2 API fallback
- Source space information retrieval
- Space validation and error handling
- Metadata extraction and processing

### 📊 [Content Service](docs/content-service.md)
Content discovery, analysis, and organization with intelligent filtering.

**Content Management:**
- Complete content discovery (pages, folders, attachments, comments)
- Space home page filtering
- Missing dependency resolution
- Hierarchy analysis and statistics
- Content counting and scope estimation

### 🖥️ [Frontend Interface](docs/frontend-interface.md)
React-based user interface providing comprehensive migration management.

**User Interface:**
- Space selection and configuration
- Real-time migration progress tracking
- Detailed logging and error reporting
- Status notifications and user guidance
- Results analysis and export capabilities

## Application Flow

See the complete [Architecture Overview](docs/architecture-overview.md) for detailed documentation of all modules, their interactions, and the complete application flow from user interface to migration completion.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.

## Quick start
- Install top-level dependencies:
```
npm install
```

- Install dependencies inside of the `static/hello-world` directory:
```
npm install
```

- Modify your app by editing the files in `static/hello-world/src/`.

- Build your app (inside of the `static/hello-world` directory):
```
npm run build
```

- Deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
