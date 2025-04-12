import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum PasswordComplexityRuleset {
  Upper = 'UPPER',
  Lower = 'LOWER',
  Number = 'NUMBER',
  Special = 'SPECIAL',
}

export const passwordComplexityRulesetLabels = new Map<PasswordComplexityRuleset, string>([
  [PasswordComplexityRuleset.Upper, T('Upper')],
  [PasswordComplexityRuleset.Lower, T('Lower')],
  [PasswordComplexityRuleset.Number, T('Number')],
  [PasswordComplexityRuleset.Special, T('Special')],
]);
