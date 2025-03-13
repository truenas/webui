import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userDetailsElements = {
  hierarchy: [T('Credentials'), T('Users (WIP)')],
  anchorRouterLink: ['/credentials/users-new'],
  elements: {
    generalInfo: {
      hierarchy: [T('General Info')],
      anchor: 'general-info',
    },
    accessCard: {
      hierarchy: [T('Access Card')],
      anchor: 'access-card',
    },
  },
} satisfies UiSearchableElement;
