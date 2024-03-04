import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchElements } from 'app/interfaces/ui-searchable-element.interface';

export const elements: UiSearchElements = {
  importPool: {
    hierarchy: [T('Storage'), T('Import Pool')],
    synonyms: [T('Add Pool')],
    anchor: 'import-pool-button',
    anchorRouterLink: ['/storage'],
  },
  createPool: {
    hierarchy: [T('Storage'), T('Create Pool')],
    synonyms: [T('Pool Wizard')],
    anchor: 'create-pool-button',
    anchorRouterLink: ['/storage'],
  },
};
