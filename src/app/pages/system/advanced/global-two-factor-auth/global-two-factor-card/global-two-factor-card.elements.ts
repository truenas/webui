import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const globalTwoFactorCardElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Global Two Factor Authentication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-global-two-factor',
    },
  },
};
