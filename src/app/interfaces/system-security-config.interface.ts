import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';

export interface SystemSecurityConfig {
  enable_fips: boolean;
  enable_gpos_stig: boolean;
  min_password_age: number | null;
  max_password_age: number | null;
  password_complexity_ruleset: { $set: PasswordComplexityRuleset[] } | null;
  min_password_length: number | null;
  password_history_length: number | null;
}
