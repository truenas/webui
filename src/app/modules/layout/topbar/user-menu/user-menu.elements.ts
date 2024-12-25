import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userMenuElements = {
  hierarchy: [T('Toolbar'), T('Settings Menu')],
  synonyms: [T('Toolbar')],
  triggerAnchor: 'user-menu',
  elements: {
    userMenu: {
      anchor: 'user-menu',
    },
    changePassword: {
      hierarchy: [T('Change Password')],
      synonyms: [
        T('Update Password'),
        T('Set new password'),
        T('Reset password'),
        T('New password'),
        T('User password'),
      ],
    },
    guide: {
      hierarchy: [T('Guide')],
    },
    myApiKeys: {
      hierarchy: [T('My API Keys')],
      synonyms: [T('API Keys')],
    },
    about: {
      hierarchy: [T('About')],
    },
    logOut: {
      hierarchy: [T('Log Out')],
      synonyms: [T('Sign Out'), T('Logout'), T('Logoff'), T('End session'), T('Exit'), T('Drop session')],
    },
  },
} satisfies UiSearchableElement;
