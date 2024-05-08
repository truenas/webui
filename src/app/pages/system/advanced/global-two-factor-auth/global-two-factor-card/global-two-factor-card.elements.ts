import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const globalTwoFactorCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Global Two Factor Authentication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    globalTwoFA: {
      anchor: 'global-two-factor-card',
    },
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
} satisfies UiSearchableElement;
