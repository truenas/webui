import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const globalTwoFactorCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Global Two Factor Authentication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-global-two-factor',
    },
  },
} satisfies UiSearchableElement;
