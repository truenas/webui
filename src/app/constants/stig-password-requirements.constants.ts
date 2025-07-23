import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';

export const gposStigPasswordComplexity = Object.freeze([
  PasswordComplexityRuleset.Upper,
  PasswordComplexityRuleset.Lower,
  PasswordComplexityRuleset.Number,
  PasswordComplexityRuleset.Special,
] as const);

export const gposStigMinPasswordAge = 1;

export const gposStigMaxPasswordAge = 60;

export const gposStigPasswordReuseLimit = 5;

export const gposStigPasswordLength = 15;

export const stigPasswordRequirements = Object.freeze({
  minPasswordAge: gposStigMinPasswordAge,
  maxPasswordAge: gposStigMaxPasswordAge,
  passwordComplexity: gposStigPasswordComplexity,
  minPasswordLength: gposStigPasswordLength,
  passwordHistoryLength: gposStigPasswordReuseLimit,
} as const);
