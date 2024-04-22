import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const localizationCardElements = {
  hierarchy: [T('System'), T('General'), T('Localization')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    configure: {
      hierarchy: [T('Settings')],
      anchor: 'configure-localization',
    },
  },
} satisfies UiSearchableElement;
