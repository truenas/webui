import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const accessFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Access')],
  triggerAnchor: 'configure-access',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    tokenLifetime: {
      hierarchy: [T('Token Lifetime')],
      synonyms: [T('Session Token Lifetime')],
    },
  },
};
