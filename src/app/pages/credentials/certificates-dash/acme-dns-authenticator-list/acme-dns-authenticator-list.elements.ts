import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const acmeDnsAuthenticatorListElements = {
  hierarchy: [T('Credentials'), T('Certificates'), T('ACME DNS-Authenticators')],
  anchorRouterLink: ['/credentials', 'certificates'],
  elements: {
    acmeDnsAuthenticatorList: {
      anchor: 'acme-dns-authenticator-list',
    },
    add: {
      hierarchy: [T('Add ACME DNS-Authenticator')],
      synonyms: [
        T('New ACME DNS-Authenticator'),
        T('Create ACME DNS-Authenticator'),
        T('ACME DNS-Authenticator'),
        T('Add DNS Authenticator'),
        T('New DNS Authenticator'),
        T('Create DNS Authenticator'),
      ],
      anchor: 'add-acme-dns-authenticator',
    },
  },
} satisfies UiSearchableElement;
