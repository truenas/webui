import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

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
} satisfies UiSearchableElement;
