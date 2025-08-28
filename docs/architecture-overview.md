# Architecture Overview

This document provides a comprehensive overview of the Confluence Migration application architecture and module interactions.

## Module Documentation

- **[Migration Orchestrator](migration-orchestrator.md)** - Central coordinator managing the complete migration workflow
- **[Migration Service](migration-service.md)** - Core content creation and asset migration operations  
- **[Space Service](space-service.md)** - Space management operations including creation and information retrieval
- **[Content Service](content-service.md)** - Content discovery, analysis, and organization with intelligent filtering
- **[Resolver API](resolver-api.md)** - Main API interface providing resolver functions for frontend communication
- **[Frontend Interface](frontend-interface.md)** - React-based user interface providing comprehensive migration management

## Application Flow Diagram

The following diagram shows how the modules interact during a complete migration process:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Resolver API   │    │  Migration      │
│   Interface     │───▶│   (index.js)    │───▶│  Orchestrator   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │  Space Service  │
         │                       │              │                 │
         │                       │              └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │ Content Service │
         │                       │              │                 │
         │                       │              └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │              Progress │              │ Migration       │
         │              Updates  │              │ Service         │
         │                  &    │              │                 │
         └──────────────── Results │              └─────────────────┘
```

## Detailed Flow Steps

### 1. **User Interface Initialization**
- **Frontend Interface** loads and initializes
- Checks connection status to source and target instances
- Displays available spaces from source instance

### 2. **Space Discovery** (`getSpaces` resolver)
```
Frontend Interface → Resolver API → Source Confluence API
```
- User interface calls `getSpaces()` resolver
- Resolver API fetches spaces from source instance
- Returns formatted space list to frontend

### 3. **Content Analysis** (`countSpaceContent` resolver)
```
Frontend Interface → Resolver API → Content Service → Source Confluence API
```
- User selects a space to analyze
- Frontend calls `countSpaceContent()` resolver
- **Content Service** discovers and counts all content types
- Applies intelligent filtering and dependency resolution
- Returns content statistics to frontend

### 4. **Migration Execution** (`migrateSpace` resolver)
```
Frontend Interface → Resolver API → Migration Orchestrator
                                           ↓
                    Space Service ← Migration Orchestrator
                                           ↓
                   Content Service ← Migration Orchestrator
                                           ↓
                  Migration Service ← Migration Orchestrator
```

**Detailed Migration Flow:**

**a. Target Space Creation**
- **Migration Orchestrator** calls **Space Service**
- **Space Service** creates target space using Forge API
- Validates space creation and returns space ID

**b. Content Discovery & Organization**
- **Migration Orchestrator** calls **Content Service**
- **Content Service** discovers all pages, folders, attachments, comments
- Applies intelligent filtering (excludes space home pages)
- Resolves missing parent dependencies
- Returns organized content arrays

**c. Dependency Tree Building**
- **Migration Orchestrator** builds dependency tree
- Ensures parents are migrated before children
- Creates proper migration order

**d. Sequential Content Migration**
- **Migration Orchestrator** calls **Migration Service** for each content item
- **Migration Service** creates pages/folders in target instance
- Migrates attachments and comments for each page
- Handles errors and implements retry logic

**e. Validation & Results**
- **Migration Orchestrator** validates migrated content hierarchy
- Checks parent-child relationships are preserved
- Generates comprehensive migration report

### 5. **Progress Updates & Results**
```
Migration Orchestrator → Resolver API → Frontend Interface
```
- Real-time progress updates flow back to frontend
- Detailed logging and status information
- Final migration results and validation reports

## Module Interaction Details

### **Frontend Interface ↔ Resolver API**
- Frontend makes resolver calls: `invoke('resolverName', parameters)`
- Resolver API processes requests and returns structured responses
- Real-time updates through resolver response handling

### **Resolver API ↔ Migration Orchestrator**
- Resolver calls migration orchestrator for complex operations
- Passes configuration and parameters
- Receives comprehensive results and progress updates

### **Migration Orchestrator ↔ Space Service**
- Gets source space details for filtering
- Creates target space for migration
- Validates space operations

### **Migration Orchestrator ↔ Content Service**
- Discovers and counts all content types
- Applies intelligent filtering rules
- Resolves missing dependencies

### **Migration Orchestrator ↔ Migration Service**
- Creates individual content items (pages, folders)
- Migrates attachments and comments
- Handles API errors and fallbacks

### **All Services ↔ Confluence APIs**
- **Source Instance:** External API calls via axios
- **Target Instance:** Forge API calls via `api.asApp()`
- Authentication and error handling

## Error Flow

```
Any Module Error → Migration Orchestrator → Resolver API → Frontend Interface
```
- Errors bubble up through the module hierarchy
- Each layer adds context and error handling
- Frontend displays user-friendly error messages
- Retry logic implemented at appropriate levels

For detailed module information, click on the links above.