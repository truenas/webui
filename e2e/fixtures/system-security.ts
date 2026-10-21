/**
 * The System Security password policy: preconditions, cleanup and readback, over the API.
 *
 * `system.security` is one config record, so there is nothing to create or delete — only five
 * password fields to write back. FIPS and STIG live in the same record and are NEVER written
 * here: enabling FIPS needs a reboot, and enabling STIG locks out every account without
 * two-factor, the suite's own admin included. {@link setPasswordPolicy} sends only the five
 * password fields, so a restore cannot carry either switch with it.
 *
 * A policy left behind is not harmless. The user and password specs (`users-form`,
 * `change-own-password`) would have their passwords refused by it, and an age or history
 * limit can stop a password being changed at all.
 */
import type { CallResponse, JobParams } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SystemSecurityEntry = CallResponse<E2eApiDirectory, 'system.security.config'>;
type SystemSecurityUpdate = JobParams<E2eApiDirectory, 'system.security.update'>[0];

export type PasswordComplexityRule = 'UPPER' | 'LOWER' | 'NUMBER' | 'SPECIAL';

/** The five fields of the password policy, as `system.security.update` takes them. */
export interface PasswordPolicy {
  min_password_age: number | null;
  max_password_age: number | null;
  /** Never null: see {@link unwrapRuleset}. An empty list is no rules. */
  password_complexity_ruleset: PasswordComplexityRule[];
  min_password_length: number | null;
  password_history_length: number | null;
}

/** The whole record, with the ruleset unwrapped to a plain list. */
export interface SystemSecurityState extends PasswordPolicy {
  enable_fips: boolean;
  enable_gpos_stig: boolean;
}

/** No policy at all: what the appliance holds out of the box, and what each test starts from. */
export const noPasswordPolicy: PasswordPolicy = {
  min_password_age: null,
  max_password_age: null,
  password_complexity_ruleset: [],
  min_password_length: null,
  password_history_length: null,
};

/**
 * How long the `system.security.update` job may take. A password-only change regenerates the
 * shadow file and nothing more (`plugins/security/config.py`). A ceiling, not a wait.
 */
export const systemSecuritySaveTimeoutMs = 60_000;

/**
 * The ruleset as a plain list.
 *
 * The generated types declare a nullable list, but middleware stores a JSON set and hands it back
 * as `{ $set: [...] }`, which is the shape the card and the form read. Both are accepted here, so
 * the readers do not depend on which one a given appliance sends.
 *
 * It is never null on read: the column is `JSON(set)`, which middleware's `sqlalchemy.py` binds
 * a null as `set()` and reads a NULL back as `set()`. So a cleared ruleset reads as an empty list,
 * and an empty list is what this returns for anything else too.
 */
function unwrapRuleset(value: unknown): PasswordComplexityRule[] {
  const list = value && typeof value === 'object' && '$set' in value ? value.$set : value;
  return Array.isArray(list) ? list as PasswordComplexityRule[] : [];
}

export async function readSystemSecurity(client: E2eApiClient): Promise<SystemSecurityState> {
  const config: SystemSecurityEntry = await firstValueFrom(
    client.api.call('system.security.config').pipe(timeout(readTimeoutMs)),
  );

  return {
    enable_fips: config.enable_fips,
    enable_gpos_stig: config.enable_gpos_stig,
    min_password_age: config.min_password_age ?? null,
    max_password_age: config.max_password_age ?? null,
    password_complexity_ruleset: unwrapRuleset(config.password_complexity_ruleset),
    min_password_length: config.min_password_length ?? null,
    password_history_length: config.password_history_length ?? null,
  };
}

/** The five password fields of a full read, for restoring them later. */
export function passwordPolicyOf(state: SystemSecurityState): PasswordPolicy {
  return {
    min_password_age: state.min_password_age,
    max_password_age: state.max_password_age,
    password_complexity_ruleset: state.password_complexity_ruleset,
    min_password_length: state.min_password_length,
    password_history_length: state.password_history_length,
  };
}

/**
 * Whether the card renders at all. Advanced Settings shows it only while
 * `system.security.info.fips_available` is true, which is the licence, not the STIG entitlement.
 */
export async function isSystemSecurityAvailable(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(client.api.call('system.security.info.fips_available').pipe(timeout(readTimeoutMs)));
}

/**
 * Writes the five password fields and nothing else. For the state a test starts from and for
 * teardown — never for the change under test, which goes through the form.
 *
 * A ruleset goes back in the `{ $set: [...] }` envelope it was read in, as the form sends it:
 * middleware refuses a plain list with "Input should be a valid set", whatever the generated
 * types declare.
 */
export async function setPasswordPolicy(client: E2eApiClient, policy: PasswordPolicy): Promise<void> {
  const update = {
    ...policy,
    password_complexity_ruleset: { $set: policy.password_complexity_ruleset },
  } as unknown as SystemSecurityUpdate;

  await runJob(
    client,
    () => client.api.callAndGetJobId('system.security.update', [update]),
    {
      timeoutMs: systemSecuritySaveTimeoutMs,
      whatItCosts: 'The password policy was not restored, so later user and password specs may have '
        + 'their passwords refused by it.',
    },
  );
}

/**
 * Whether the API client's own account has a two-factor secret. The generated `auth.me` types
 * leave `two_factor_config` open, so the one field is narrowed here.
 */
export async function suiteAdminHasTwoFactorSecret(client: E2eApiClient): Promise<boolean> {
  const me = await firstValueFrom(client.api.call('auth.me').pipe(timeout(slowCallTimeoutMs)));
  const config: unknown = me.two_factor_config;
  return Boolean(config && typeof config === 'object' && 'secret_configured' in config && config.secret_configured);
}
