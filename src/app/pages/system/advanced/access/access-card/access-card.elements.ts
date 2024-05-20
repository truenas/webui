import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const accessCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Access')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    access: {
      synonyms: [T('Configure Sessions'), T('Sessions')],
      anchor: 'access-card',
    },
    terminateOtherSessions: {
      hierarchy: [T('Terminate Other Sessions')],
      synonyms: [T('Terminate Other User Sessions')],
    },
    tokenLifetime: {
      hierarchy: [T('Token Lifetime')],
      synonyms: [T('Session Token Lifetime')],
    },
  },
} satisfies UiSearchableElement;
