import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sedCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Self-Encrypting Drive')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-sed',
    },
  },
} satisfies UiSearchableElement;
