import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';

export const globalTwoFactorFormElements = {
  hierarchy: [T('System'), T('Advanced'), T('Global Two Factor Auth')],
  triggerAnchor: 'configure-global-two-factor',
  anchorRouterLink: ['/system', 'advanced'],
  requiredRoles: [Role.FullAdmin],
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
