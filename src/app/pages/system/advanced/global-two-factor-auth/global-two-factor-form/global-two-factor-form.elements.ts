import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const globalTwoFactorFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Global Two Factor Auth')],
  triggerAnchor: 'configure-global-two-factor',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    globallyEnabled: {
      hierarchy: [T('Global 2FA Enable')],
      synonyms: [T('Enable Two Factor Authentication Globally'), T('Two Factor Auth'), T('2FA')],
    },
    toleranceWindow: {
      hierarchy: [T('Window')],
      synonyms: [T('Tolerance Window')],
    },
    enableForSsh: {
      hierarchy: [T('SSH')],
      synonyms: [T('Enable Two Factor Authentication for SSH')],
    },
  },
};
