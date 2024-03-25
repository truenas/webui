import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const storageSettingsFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Storage')],
  triggerAnchor: 'storage-settings',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    systemPool: {
      hierarchy: [T('System Data Pool')],
    },
    swapSize: {
      hierarchy: [T('Swap Size')],
    },
  },
};
