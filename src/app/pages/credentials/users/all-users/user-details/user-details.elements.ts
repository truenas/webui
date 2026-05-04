import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userDetailsElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials/users'],
  elements: {
    generalInfo: {
      hierarchy: [T('General Info')],
      anchor: 'general-info',
    },
    profile: {
      hierarchy: [T('Profile')],
      anchor: 'profile',
      inset: true,
    },
    accessCard: {
      hierarchy: [T('Access Card')],
      anchor: 'access-card',
      inset: true,
    },
    passwordCard: {
      hierarchy: [T('Password Card')],
      anchor: 'password-card',
      inset: true,
    },
  },
} satisfies UiSearchableElement;
