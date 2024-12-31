import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const bootEnvStatusElements = {
  hierarchy: [T('System'), T('Boot'), T('Boot Pool Status')],
  anchorRouterLink: ['/system', 'boot', 'status'],
  elements: {
    bootStatus: {
      anchor: 'boot-status',
    },
  },
} satisfies UiSearchableElement;
