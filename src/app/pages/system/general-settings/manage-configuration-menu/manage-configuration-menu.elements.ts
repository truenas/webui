import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const manageConfigurationElements = {
  hierarchy: [T('System Settings'), T('General'), T('Manage Configuration')],
  anchorRouterLink: ['/system', 'general'],
  triggerAnchor: 'manage-configuration',
  elements: {
    manageConfiguration: {
      anchor: 'manage-configuration',
    },
    downloadFile: {
      hierarchy: [T('Download File')],
    },
    uploadFile: {
      hierarchy: [T('Upload File')],
    },
    resetToDefaults: {
      hierarchy: [T('Reset to Defaults')],
    },
  },
};
