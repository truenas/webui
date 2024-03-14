import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  globallyEnabled: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Global Two Factor Auth'), T('Global 2FA Enable')],
    synonyms: [T('Enable Two Factor Authentication Globally'), T('Two Factor Auth'), T('2FA')],
    triggerAnchor: 'global-two-factor-auth',
    anchorRouterLink: ['/system', 'advanced'],
  },
  torelanceWindow: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Global Two Factor Auth'), T('Window')],
    synonyms: [T('Torelance Window')],
    triggerAnchor: 'global-two-factor-auth',
    anchorRouterLink: ['/system', 'advanced'],
  },
  enableForSsh: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Global Two Factor Auth'), T('SSH')],
    synonyms: [T('Enable Two Factor Authentication for SSH')],
    triggerAnchor: 'global-two-factor-auth',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
