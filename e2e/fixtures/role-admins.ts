/**
 * Restricted administrators: throwaway accounts that sign in holding less than
 * full admin, for the specs that check what the UI locks for them.
 *
 * Middleware ships two built-in restricted privileges, each attached to its own
 * built-in group (`builtin_roles_groups`, 24.04). Putting a user in the group is
 * all it takes, so nothing here creates a privilege, and nothing here may change
 * or delete those groups: every appliance has them and nothing gives them back.
 */
import { findGroup } from './groups';
import { ensureSignInCapableUser, ensureUserAbsent } from './users';
import type { E2eApiClient } from '../support/api/client';

export interface RoleAdmin {
  username: string;
  /** Meets the appliance's complexity rules; not a credential of any real account. */
  password: string;
  /** The built-in group whose privilege carries the role. */
  group: string;
}

export const roleAdmins = {
  /** `READONLY_ADMINISTRATOR`: the `READONLY_ADMIN` role. */
  readOnly: {
    username: 'e2e_ro_admin',
    password: 'E2E-RoAdmin-Passw0rd!',
    group: 'truenas_readonly_administrators',
  },
  /** `SHARING_ADMINISTRATOR`: `READONLY_ADMIN` plus the sharing, dataset and `SERVICE_READ` roles. */
  sharing: {
    username: 'e2e_share_admin',
    password: 'E2E-ShareAdmin-Passw0rd!',
    group: 'truenas_sharing_administrators',
  },
} as const satisfies Record<string, RoleAdmin>;

/** Creates the account in its built-in group, if absent. */
export async function ensureRoleAdminPresent(client: E2eApiClient, account: RoleAdmin): Promise<void> {
  const group = await findGroup(client, account.group);
  if (!group) {
    throw new Error(`group.query returned no ${account.group} row, so ${account.username} has no group to join.`);
  }

  await ensureSignInCapableUser(client, account.username, {
    password: account.password,
    groups: [group.id],
  });
}

/** Removes the account, if present. The built-in group stays. */
export async function ensureRoleAdminAbsent(client: E2eApiClient, account: RoleAdmin): Promise<void> {
  await ensureUserAbsent(client, account.username);
}
