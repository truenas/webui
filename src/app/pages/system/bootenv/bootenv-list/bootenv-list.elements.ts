import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const bootListElements = {
  hierarchy: [T('System'), T('Boot Environments')],
  anchorRouterLink: ['/system', 'boot'],
  synonyms: [T('Create boot environment')],
  elements: {
    boot: {
      anchor: 'boot-list',
    },
    stats: {
      hierarchy: [T('Stats/Settings')],
    },
    scrubBootPool: {
      hierarchy: [T('Scrub Boot Pool')],
    },
  },
} satisfies UiSearchableElement;
