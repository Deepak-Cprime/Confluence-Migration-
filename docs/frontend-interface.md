# Frontend Interface

The Frontend Interface provides the user-facing components and interactions for the Confluence Migration application. Built with React, it offers a comprehensive interface for managing and monitoring space migrations.

## Overview

The frontend is located in the `static/hello-world/src/` directory and provides a React-based interface for users to interact with the migration functionality.

## Application Structure

### Main Application (`App.js`)
The main application component serves as the root container and coordinates all migration functionality.

**Key Features:**
- **State Management:** Centralized state management for migration process
- **Component Orchestration:** Coordinates interaction between all UI components
- **Error Handling:** Global error handling and user notification
- **Progress Tracking:** Overall migration progress management

### User Interface Components

### `ConnectionStatus.js`
**Purpose:** Displays the connection status to source and target Confluence instances.

**Features:**
- **Real-time Status:** Live connection status monitoring
- **Visual Indicators:** Clear visual indicators for connection state
- **Error Display:** Connection error messages and troubleshooting
- **Retry Functionality:** Options to retry failed connections

**Status Types:**
- **Connected:** Successfully connected to instances
- **Connecting:** Connection attempt in progress
- **Disconnected:** No connection established
- **Error:** Connection failed with error details

### `SpaceSelector.js`
**Purpose:** Provides interface for selecting source spaces for migration.

**Features:**
- **Space Discovery:** Automatic discovery of available spaces
- **Search and Filter:** Search functionality for large space lists
- **Space Information:** Display space details (name, key, description, last modified)
- **Selection Management:** Single and multiple space selection support
- **Validation:** Space selection validation before migration

**Space Display Information:**
- Space name and key
- Space description
- Last modification date
- Space URL link
- Content count preview

### `MigrationProgress.js`
**Purpose:** Real-time migration progress tracking and visualization.

**Features:**
- **Progress Visualization:** Progress bars and percentage indicators
- **Stage Tracking:** Shows current migration stage
- **Item Counting:** Real-time count of migrated vs total items
- **Time Estimation:** Estimated completion time
- **Detailed Status:** Current operation being performed

**Progress Stages:**
1. **Initialization:** Setting up migration process
2. **Space Creation:** Creating target space
3. **Content Discovery:** Discovering source content
4. **Content Migration:** Migrating pages, folders, attachments, comments
5. **Validation:** Post-migration validation
6. **Completion:** Final results and summary

### `MigrationLog.js`
**Purpose:** Detailed logging interface showing migration operations and results.

**Features:**
- **Real-time Logging:** Live log updates during migration
- **Log Filtering:** Filter logs by type (info, warning, error)
- **Export Functionality:** Export logs for troubleshooting
- **Search Capability:** Search through migration logs
- **Log Levels:** Different log levels with visual indicators

**Log Types:**
- **Info:** General information about migration progress
- **Success:** Successfully completed operations
- **Warning:** Non-critical issues that don't stop migration
- **Error:** Critical errors requiring attention

### `StatusNotifications.js`
**Purpose:** User notification system for migration events and status updates.

**Features:**
- **Toast Notifications:** Non-intrusive status updates
- **Alert Messages:** Important notifications requiring attention
- **Success Confirmations:** Confirmation of completed operations
- **Error Notifications:** Clear error messages with resolution guidance
- **Dismissible Notifications:** User-controlled notification management

**Notification Types:**
- **Success:** Operation completed successfully
- **Info:** General information updates
- **Warning:** Potential issues or important information
- **Error:** Critical errors requiring user action

## User Workflow

### Migration Process Flow

1. **Application Launch**
   - Initial connection status check
   - Authentication verification
   - Interface initialization

2. **Source Space Selection**
   - Discover available spaces
   - Display space information
   - User selects source space
   - Preview migration scope

3. **Target Configuration**
   - Specify target space details
   - Configure migration options
   - Validate configuration

4. **Migration Execution**
   - Initialize migration process
   - Real-time progress tracking
   - Live log monitoring
   - Status notifications

5. **Results Review**
   - Migration completion summary
   - Success/failure statistics
   - Error review and resolution
   - Log export options

## State Management

### Application State
The frontend maintains comprehensive state for the entire migration process:

```javascript
{
  // Connection status
  connectionStatus: {
    source: 'connected' | 'connecting' | 'disconnected' | 'error',
    target: 'connected' | 'connecting' | 'disconnected' | 'error',
    errors: []
  },
  
  // Available spaces
  spaces: [/* array of space objects */],
  selectedSpace: null,
  
  // Migration configuration
  migrationConfig: {
    targetSpaceKey: '',
    targetSpaceName: '',
    targetSpaceDescription: '',
    options: {}
  },
  
  // Migration process
  migration: {
    inProgress: false,
    stage: '',
    progress: 0,
    logs: [],
    results: null,
    errors: []
  },
  
  // UI state
  ui: {
    notifications: [],
    loading: false,
    activeTab: 'selection'
  }
}
```

## API Integration

### Resolver Communication
The frontend communicates with backend resolvers through the Forge platform:

```javascript
// Example resolver calls
const spaces = await invoke('getSpaces');
const counts = await invoke('countSpaceContent', { spaceKey });
const result = await invoke('migrateSpace', migrationConfig);
```

### Error Handling
Comprehensive error handling for API communications:
- **Network Errors:** Connection and timeout handling
- **API Errors:** Backend error response processing
- **Validation Errors:** Input validation and user feedback
- **Recovery Options:** Error recovery and retry mechanisms

## User Experience Features

### Responsive Design
- **Mobile Support:** Responsive design for various screen sizes
- **Accessibility:** WCAG compliance for accessibility
- **Browser Compatibility:** Cross-browser compatibility
- **Performance:** Optimized for smooth user experience

### Visual Feedback
- **Loading States:** Clear loading indicators during operations
- **Progress Visualization:** Visual progress bars and indicators
- **Status Colors:** Color-coded status indicators
- **Icons and Graphics:** Intuitive icons for different states and actions

### User Guidance
- **Tooltips:** Helpful tooltips for complex features
- **Help Text:** Contextual help and guidance
- **Validation Messages:** Clear validation feedback
- **Success Indicators:** Confirmation of successful operations

## Performance Optimization

### Component Optimization
- **React Optimization:** Efficient component rendering and updates
- **Memory Management:** Proper cleanup of event listeners and timers
- **State Optimization:** Efficient state update patterns
- **Bundle Optimization:** Optimized build configuration for performance

### User Experience Optimization
- **Lazy Loading:** Lazy loading of components and data
- **Caching:** Strategic caching of frequently accessed data
- **Debouncing:** Input debouncing for search and filtering
- **Progressive Loading:** Progressive data loading for large datasets

## File Structure
```
static/hello-world/src/
├── App.js                    # Main application component
├── index.js                  # Application entry point
└── components/
    ├── ConnectionStatus.js   # Connection status display
    ├── MigrationLog.js      # Migration logging interface
    ├── MigrationProgress.js # Progress tracking display
    ├── SpaceSelector.js     # Space selection interface
    └── StatusNotifications.js # User notification system
```

## Dependencies
- **React:** Frontend framework
- **Forge UI Components:** Atlassian Forge UI components
- **Additional Libraries:** As needed for specific functionality

## Integration Points

### Backend Integration
- **Resolver Calls:** Communication with backend resolver functions
- **State Synchronization:** Keeping frontend state synchronized with backend
- **Error Propagation:** Proper error handling and display
- **Progress Updates:** Real-time progress updates from backend

### Atlassian Integration
- **Forge Platform:** Integration with Atlassian Forge platform
- **Confluence UI:** Integration with Confluence user interface
- **Authentication:** Forge authentication integration
- **Permissions:** Proper permission handling and validation