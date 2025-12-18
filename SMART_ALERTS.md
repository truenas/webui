# Smart Alerts Implementation

## Overview

This document describes the Smart Alerts system implemented in TrueNAS WebUI. The system transforms basic alert notifications into intelligent, actionable guidance with contextual help and navigation integration.

## Key Features

### 1. **Actionable Alert Buttons**
Each alert can display smart action buttons that help users resolve issues:
- **Navigate actions**: Direct links to relevant configuration pages
- **External links**: Documentation, support contacts, release notes
- **Primary actions**: Highlighted main action for quick resolution

### 2. **Contextual Help**
Alerts include expandable help sections that explain:
- Why the alert is appearing
- What it means for the system
- How to resolve the issue
- Links to detailed documentation

### 3. **Category-Based Grouping**
Alerts are organized by category for better navigation:
- Storage
- Network
- Services
- System
- Security
- Hardware
- Tasks
- Applications

### 4. **Navigation Badge System** ✅
Alert counts display on navigation menu items:
- Main menu badges (Storage, System, Credentials, etc.)
- Submenu badges (System > General Settings, Credentials > Certificates, etc.)
- Color-coded severity (red for critical, orange for warning)
- Real-time updates as alerts change

## Architecture

### Core Components

#### 1. **Interfaces** (`src/app/interfaces/smart-alert.interface.ts`)
Defines the structure for smart alerts:
- `SmartAlertCategory`: Alert categories
- `SmartAlertActionType`: Types of actions (Navigate, Modal, ExternalLink, ApiCall)
- `SmartAlertAction`: Action button configuration
- `SmartAlertEnhancement`: Enhancement metadata
- `EnhancedAlert`: Alert with smart features

#### 2. **Enhancement Registry** (`src/app/modules/alerts/services/alert-enhancement.registry.ts`)
Central configuration mapping alert sources to enhancements:
- Maps 15+ alert sources to actionable items
- Includes contextual help text
- Defines navigation paths for related pages
- Categorizes alerts for grouping

**Currently Enhanced Alerts:**
- LicenseStatus
- ProactiveSupport
- CertificateAlert
- VolumeStatus
- PoolCapacity
- IPMIStatus
- ServiceMonitor
- ApplicationsStatus
- UpdateCheck
- CloudSyncTaskFailed
- ReplicationTaskFailed
- ScrubTaskFailed
- HardwareStatus
- UpsStatus

#### 3. **Smart Alert Service** (`src/app/modules/alerts/services/smart-alert.service.ts`)
Core service for alert enhancement:
- `enhanceAlert()`: Enriches basic alerts with smart features
- `groupAlertsByCategory()`: Groups alerts by category
- `getAlertCountsByMenuPath()`: Computes badge counts for navigation
- Handles action execution (navigation, external links)

#### 4. **Enhanced Alert Component** (`src/app/modules/alerts/components/alert/alert.component.*`)
Updated alert display component:
- Shows smart action buttons
- Displays contextual help (collapsible)
- Maintains existing dismiss/reopen functionality
- Backward compatible with non-enhanced alerts

#### 5. **Enhanced Alerts Panel** (`src/app/modules/alerts/components/alerts-panel/alerts-panel.component.*`)
Updated panel with category grouping:
- Toggle between grouped and flat views
- Category sections with icons and counts
- All existing functionality preserved

#### 6. **Navigation Badge Service** (`src/app/modules/alerts/services/alert-nav-badge.service.ts`)
Integrated with navigation components:
- `getBadgeCountsSignal()`: Returns signal of badge counts by menu path
- `getBadgeCountForPath()`: Gets count for specific menu path
- `hasCriticalAlerts()`: Checks for critical alerts by path
- Used by NavigationComponent and SecondaryMenuComponent

#### 7. **Enhanced Navigation Components**
**NavigationComponent** (`src/app/modules/layout/navigation/navigation.component.*`)
- Displays badges on main menu items (Storage, System, Credentials, etc.)
- Color-coded badges (red for critical, orange for warning)
- Real-time updates via signals

**SecondaryMenuComponent** (`src/app/modules/layout/secondary-menu/secondary-menu.component.*`)
- Displays badges on submenu items
- Inherits parent menu name for path calculation
- Same color-coding as main menu

## Usage

### Adding New Alert Enhancements

To enhance a new alert type, add an entry to `smartAlertRegistry` in `alert-enhancement.registry.ts`:

```typescript
export const smartAlertRegistry: SmartAlertConfig = {
  bySource: {
    'YourAlertSource': {
      category: SmartAlertCategory.System,
      relatedMenuPath: ['path', 'to', 'page'],
      contextualHelp: 'Brief explanation of the alert',
      documentationUrl: 'https://docs.truenas.com/...',
      actions: [
        {
          label: 'Fix Issue',
          type: SmartAlertActionType.Navigate,
          icon: 'mdi-wrench',
          route: ['/path', 'to', 'fix'],
          primary: true,
        },
        {
          label: 'Learn More',
          type: SmartAlertActionType.ExternalLink,
          icon: 'mdi-book-open-variant',
          externalUrl: 'https://docs.truenas.com/...',
        },
      ],
    },
  },
};
```

### Navigation Badges in Action

The navigation badges are fully integrated and work automatically. When alerts are mapped to menu paths in the registry, badges appear on the corresponding menu items:

**Example Flow:**
1. License alert appears with source "LicenseStatus"
2. Registry maps it to `relatedMenuPath: ['system', 'general', 'support']`
3. Badge appears on "System" main menu item
4. Badge also appears on "General Settings" submenu item
5. Badge color is red (critical) or orange (warning) based on alert level

**How it Works:**
- `AlertNavBadgeService` computes badge counts from enhanced alerts
- `NavigationComponent` displays badges on main menu
- `SecondaryMenuComponent` displays badges on submenus
- Material's `matBadge` directive handles the UI
- Signals ensure real-time reactivity

## Design Decisions

### Client-Side Enhancement
All enhancements are applied on the client side, requiring no backend API changes. This allows for rapid iteration and deployment.

### Backward Compatibility
The system is fully backward compatible:
- Alerts without enhancements display normally
- Existing alert functionality (dismiss, reopen) unchanged
- No breaking changes to alert interface

### Extensibility
The registry-based approach makes it easy to:
- Add new alert enhancements
- Update existing enhancements
- Create category-specific behaviors
- Extend action types

### Progressive Disclosure
Context help is collapsed by default to maintain clean UI, with easy expansion for users who need more information.

## Styling

Smart alerts use TrueNAS design system variables:
- Primary actions use `--primary` color
- Category headers use `--alt-bg1` background
- Icons use Material Design Icons (mdi-*)
- Maintains dark/light theme compatibility

## Future Enhancements

### Backend Integration (Phase 2)
When backend support is added, the API could return:
```json
{
  "category": "storage",
  "actions": [...],
  "context": {
    "affected_resources": ["pool: tank"],
    "system_state": {...}
  }
}
```

### Advanced Features (Phase 3)
- One-click automated fixes for safe operations
- Guided workflows for complex issues
- Alert correlation (group related alerts)
- User preference system for alert verbosity
- Real-time navigation badges

## Files Changed/Created

### New Files
- `src/app/interfaces/smart-alert.interface.ts`
- `src/app/modules/alerts/services/alert-enhancement.registry.ts`
- `src/app/modules/alerts/services/smart-alert.service.ts`
- `src/app/modules/alerts/services/alert-nav-badge.service.ts`

### Modified Files
- `src/app/modules/alerts/components/alert/alert.component.ts`
- `src/app/modules/alerts/components/alert/alert.component.html`
- `src/app/modules/alerts/components/alert/alert.component.scss`
- `src/app/modules/alerts/components/alerts-panel/alerts-panel.component.ts`
- `src/app/modules/alerts/components/alerts-panel/alerts-panel.component.html`
- `src/app/modules/alerts/components/alerts-panel/alerts-panel.component.scss`
- `src/app/modules/alerts/store/alert.selectors.ts`
- `src/app/modules/layout/navigation/navigation.component.ts`
- `src/app/modules/layout/navigation/navigation.component.html`
- `src/app/modules/layout/navigation/navigation.component.scss`
- `src/app/modules/layout/secondary-menu/secondary-menu.component.ts`
- `src/app/modules/layout/secondary-menu/secondary-menu.component.html`

## Testing

The implementation:
- ✅ Passes linting checks
- ✅ Builds successfully
- ✅ Maintains backward compatibility
- ✅ Navigation badges implemented and integrated
- ⏳ Ready for manual testing with live alerts

## Visual Guide

### Alert Panel Features
- **Smart Action Buttons**: Primary actions highlighted, secondary actions available
- **Contextual Help**: Expandable "Why am I seeing this?" section with explanation
- **Category Grouping**: Toggle between grouped view (by category) and flat list
- **Documentation Links**: Quick access to relevant docs

### Navigation Badges
- **Main Menu**: Badge appears on top-level items (e.g., Storage, System, Credentials)
- **Submenu**: Badge also appears on specific subpages (e.g., General Settings, Certificates)
- **Color Coding**:
  - Red badge = Critical alerts (Emergency, Alert, Critical levels)
  - Orange badge = Warning alerts (Error, Warning levels)
- **Real-time**: Badges update immediately as alerts change

## Next Steps

1. **Manual Testing**: Test with actual alerts in development environment
   - Create test alerts to verify badge display
   - Test all enhanced alert types
   - Verify category grouping works correctly
   - Check navigation badges on all menu items

2. **Add More Enhancements**: Expand the registry with more alert sources
   - Add remaining alert types from AlertClassName enum
   - Create more specific actions based on alert context
   - Add documentation links for all alerts

3. **User Testing**: Gather feedback on helpfulness of actions and context
   - Are action buttons intuitive?
   - Is contextual help useful?
   - Do navigation badges help users find issues?

4. **Backend Collaboration**: Work with backend team for Phase 2 features
   - API support for action execution
   - Contextual data in alert payloads
   - Alert correlation for related issues
