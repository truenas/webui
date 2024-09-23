import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const accessCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Access')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    access: {
      synonyms: [T('Configure Sessions'), T('Sessions')],
      anchor: 'access-card',
    },
    configure: {
      anchor: 'access-settings',
      hierarchy: [T('Configure Access')],
      synonyms: [T('Access Settings')],
    },
    terminateOtherSessions: {
      hierarchy: [T('Terminate Other Sessions')],
      synonyms: [T('Terminate Other User Sessions')],
    },
    sessionTimeout: {
      hierarchy: [T('Session Timeout')],
      synonyms: [T('Session Token Lifetime')],
    },
    loginBanner: {
      hierarchy: [T('Login Banner')],
      synonyms: [T('MOTD')],
    },
  },
} satisfies UiSearchableElement;
