# POSIX ACL Editor Prototype

This is a prototype implementation of an improved POSIX ACL editor that addresses the UX issues identified in the existing implementation.

## Access the Prototype

Navigate to `/acl-prototype` in the TrueNAS WebUI to see the prototype in action.

## Key Improvements Demonstrated

### 1. Better Screen Real Estate Usage
- **Prominent Presets Section**: Moved presets to the top with expandable cards showing preset previews
- **Separated ACCESS and DEFAULT**: Clear visual distinction between the two types of ACL entries
- **Collapsed Advanced Options**: Rarely used settings are hidden by default

### 2. Educational Content
- **Permission Explanations**: Interactive help panels explaining how ACL permissions work
- **ACCESS vs DEFAULT Guide**: Clear explanation of the difference between access and default permissions
- **Effective Permissions**: Dynamic explanation of how mask entries affect permissions

### 3. Improved Visual Hierarchy
- **Two-Column Layout**: ACCESS and DEFAULT permissions displayed side-by-side
- **Clear Entry Cards**: Each ACL entry is displayed in its own card with clear type indicators
- **Required vs Optional**: Visual indicators for required entries (USER_OBJ, GROUP_OBJ, OTHER)

### 4. Enhanced Presets Experience
- **Visual Preset Cards**: Presets shown as interactive cards with permission previews
- **Quick Apply**: One-click preset application
- **Prominent Save**: Save as preset functionality more visible

### 5. Helpful Shortcuts & Automation
- **Auto MASK Management**: Automatically suggest adding MASK entries when needed
- **Copy ACCESS to DEFAULT**: Easy button to copy permissions
- **Smart Validation**: Background validation with helpful error messages

### 6. Better Mobile Experience
- **Responsive Design**: Layout adapts to smaller screens
- **Touch-Friendly**: Larger touch targets and better spacing

## Technical Implementation

The prototype uses:
- Angular Signals for reactive state management
- Angular Material components for consistent UI
- Standalone components for better tree-shaking
- Proper TypeScript typing throughout

## Sample Data

The prototype includes realistic sample data showing:
- A mixed ACCESS ACL with user, group, and mask entries
- DEFAULT permissions for directory inheritance
- Multiple preset configurations (Open Dataset, Restricted, Collaborative)

## Future Enhancements

This prototype demonstrates the UX improvements but doesn't include:
- Real API integration
- Form validation and error handling
- Permission editing functionality
- File system integration

The focus is on the visual design and user experience improvements that can be applied to the production ACL editor.