import { CallResponse, JobParams } from '@truenas/api-client';
import { PasswordComplexityRuleset } from 'app/enums/password-complexity-ruleset.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface SystemSecurityConfig {
  enable_fips: boolean;
  enable_gpos_stig: boolean;
  min_password_age: number | null;
  max_password_age: number | null;
  password_complexity_ruleset: { $set: PasswordComplexityRuleset[] } | null;
  min_password_length: number | null;
  password_history_length: number | null;
}

/**
 * Reads `system.security.config`. Middleware's JSON encoder writes a Python set as a `{ $set: [...] }`
 * envelope, which is how `password_complexity_ruleset` arrives, while the generated model declares a
 * plain list of the rules.
 */
export function toSystemSecurityConfig(config: CallResponse<D, 'system.security.config'>): SystemSecurityConfig {
  return config as unknown as SystemSecurityConfig;
}

/**
 * `system.security.update` declares `password_complexity_ruleset` as a plain list; the form has always sent
 * the `{ $set }` envelope the config read returns. The request is unchanged.
 */
export function toSystemSecurityUpdateArgs(
  config: SystemSecurityConfig,
): JobParams<D, 'system.security.update'>[0] {
  return config as unknown as JobParams<D, 'system.security.update'>[0];
}
