import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const storageElements = {
  anchorRouterLink: ['/storage'],
  hierarchy: [T('Storage Dashboard')],
  elements: {
    storageDashboard: {
      synonyms: [T('Pools')],
    },
    importPool: {
      hierarchy: [T('Import Pool')],
      synonyms: [T('Add Pool')],
    },
    createPool: {
      hierarchy: [T('Create Pool')],
      synonyms: [T('Pool Wizard')],
    },
  },
};
