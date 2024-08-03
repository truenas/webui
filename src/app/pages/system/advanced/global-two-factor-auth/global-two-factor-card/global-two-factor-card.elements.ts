import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const globalTwoFactorCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Global Two Factor Authentication')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    globalTwoFA: {
      anchor: 'global-two-factor-card',
    },
    configure: {
      anchor: 'global-two-factor-settings',
      hierarchy: [T('Configure Global Two Factor Authentication')],
      synonyms: [T('Global Two Factor Authentication Settings'), T('2FA Settings')],
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
