import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const emailCardElements = {
  hierarchy: [T('System'), T('General'), T('Email')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    configure: {
      hierarchy: [T('Settings')],
      anchor: 'configure-email',
    },
  },
};
