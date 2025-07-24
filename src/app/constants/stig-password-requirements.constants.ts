import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';

// SRG-OS-000069-GPOS-00037, SRG-OS-000070-GPOS-00038, SRG-OS-000071-GPOS-00039
export const gposStigPasswordComplexity = Object.freeze([
  PasswordComplexityRuleset.Upper,
  PasswordComplexityRuleset.Lower,
  PasswordComplexityRuleset.Number,
  PasswordComplexityRuleset.Special,
] as const);

export const gposStigMinPasswordAge = 1; // SRG-OS-000075-GPOS-00043

export const gposStigMaxPasswordAge = 60; // SRG-OS-000076-GPOS-00044

export const gposStigPasswordReuseLimit = 5; // SRG-OS-000077-GPOS-00045

export const gposStigPasswordLength = 15; // SRG-OS-000078-GPOS-00046

export const stigPasswordRequirements = Object.freeze({
  minPasswordAge: gposStigMinPasswordAge,
  maxPasswordAge: gposStigMaxPasswordAge,
  passwordComplexity: gposStigPasswordComplexity,
  minPasswordLength: gposStigPasswordLength,
  passwordHistoryLength: gposStigPasswordReuseLimit,
} as const);
