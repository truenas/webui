import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const twoFactorElements = {
  hierarchy: [T('Credentials'), T('Two-Factor Authentication')],
  anchorRouterLink: ['/credentials', 'two-factor'],
  elements: {
    twoFactor: {},
    configure2FaSecret: {
      hierarchy: [T('Configure 2FA Secret')],
      anchor: 'configure-2fa-secret',
    },
  },
};
