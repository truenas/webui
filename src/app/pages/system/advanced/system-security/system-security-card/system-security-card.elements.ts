import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const systemSecurityCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('System Security')],
  anchorRouterLink: ['/system', 'advanced'],
  synonyms: [T('FIPS'), T('STIG'), T('Password Policy'), T('Security')],
  visibleTokens: [GlobalSearchVisibleToken.SystemSecurity],
  elements: {
    card: {
      anchor: 'system-security-card',
    },
    settings: {
      anchor: 'system-security-settings',
      hierarchy: [T('System Security Settings')],
      synonyms: [T('Configure System Security')],
    },
    enableFips: {
      hierarchy: [T('Enable FIPS')],
    },
    enableGposStig: {
      hierarchy: [T('Enable General Purpose OS STIG compatibility mode')],
      synonyms: [T('STIG')],
    },
    minPasswordAge: {
      hierarchy: [T('Min Password Age')],
    },
    maxPasswordAge: {
      hierarchy: [T('Max Password Age')],
    },
    passwordComplexityRuleset: {
      hierarchy: [T('Password Complexity Ruleset')],
    },
    minPasswordLength: {
      hierarchy: [T('Min Password Length')],
    },
    passwordHistoryLength: {
      hierarchy: [T('Password History Length')],
    },
  },
} satisfies UiSearchableElement;
