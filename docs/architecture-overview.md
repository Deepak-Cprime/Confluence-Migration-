# Architecture Overview

This document provides a comprehensive overview of the Confluence Migration application architecture and module interactions.

## Module Documentation

- **[Migration Orchestrator](migration-orchestrator.md)** - Central coordinator managing the complete migration workflow
- **[Migration Service](migration-service.md)** - Core content creation and asset migration operations  
- **[Space Service](space-service.md)** - Space management operations including creation and information retrieval
- **[Content Service](content-service.md)** - Content discovery, analysis, and organization with intelligent filtering
- **[Resolver API](resolver-api.md)** - Main API interface providing resolver functions for frontend communication
- **[Frontend Interface](frontend-interface.md)** - React-based user interface providing comprehensive migration management

## Application Flow

The migration process follows this flow:

1. **Frontend Interface** → **Resolver API** → **Migration Orchestrator**
2. **Migration Orchestrator** coordinates with all service modules
3. **Space Service** creates target space
4. **Content Service** discovers and organizes source content  
5. **Migration Service** creates content in target instance
6. Results flow back through the chain to the frontend

For detailed module information, click on the links above.