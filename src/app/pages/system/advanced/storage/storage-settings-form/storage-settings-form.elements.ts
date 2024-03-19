import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  systemPool: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Storage'), T('System Data Pool')],
    synonyms: [],
    triggerAnchor: 'storage-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  swapSize: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Storage'), T('Swap Size')],
    synonyms: [],
    triggerAnchor: 'storage-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
