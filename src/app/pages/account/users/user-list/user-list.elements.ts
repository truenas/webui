import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const userListElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials', 'users'],
  elements: {
    list: {},
    add: {
      hierarchy: [T('Add')],
      anchor: 'add-user',
    },
  },
};
