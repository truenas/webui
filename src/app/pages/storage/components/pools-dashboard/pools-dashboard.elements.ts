import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  storageDashboard: {
    hierarchy: [T('Storage Dashboard')],
    synonyms: [],
    anchorRouterLink: ['/storage'],
  },
  importPool: {
    hierarchy: [T('Storage'), T('Import Pool')],
    synonyms: [T('Add Pool')],
    anchorRouterLink: ['/storage'],
  },
  createPool: {
    hierarchy: [T('Storage'), T('Create Pool')],
    synonyms: [T('Pool Wizard')],
    anchorRouterLink: ['/storage'],
  },
};
