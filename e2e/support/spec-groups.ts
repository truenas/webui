/**
 * Which specs may share the appliance with others running at the same time.
 * Every spec under `tests/` not named here runs in the `serial` project, alone.
 *
 * Opt-in, so a new spec is serial until someone decides otherwise: a spec
 * wrongly listed here fails other people's tests intermittently, one wrongly
 * left out only costs time.
 *
 * A spec belongs in {@link parallelSpecs} only if it touches nothing it did not
 * create, under a name no other spec uses, and asserts on nothing another spec
 * could change while it runs. Things that rule a spec out, all seen in this suite:
 *
 * - Any appliance-wide setting, service state or service config — including a
 *   cleanup that merely stops a service.
 * - Building, exporting or changing any pool or disk, or the shared pool's own
 *   properties. Datasets under the shared pool are fine.
 * - The admin's preferences — dashboard layout, theme, language — since every
 *   worker signs in as that one user.
 * - Counting a kind of thing across the appliance: the "is there room on the
 *   card" guards (`requireRoomOnCard` and friends), `count*` before-and-after
 *   checks, empty states, the jobs, audit and alert lists.
 * - Acting on a row of a card that shows only the first few — the SMB card and
 *   the Data Protection cards — since rows from other specs can push it off.
 * - A fixed account shared between specs, like the `roles-*` admins.
 *
 * A spec listed here also relies on the specs that would break it staying out
 * of it: the certificate card checks, for one, hold only while every other spec
 * that creates certificates is serial.
 *
 * Names are relative to `e2e/tests/`. A name with no file behind it fails the
 * config, so a renamed spec cannot silently drop back to serial.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const testsDir = join(import.meta.dirname, '..', 'tests');

/** Globs for the config's `testMatch` and `testIgnore`, anchored to `e2e/tests/` so no other directory matches. */
function specGlobs(names: string[]): string[] {
  const missing = names.filter((name) => !existsSync(join(testsDir, `${name}.e2e.ts`)));
  if (missing.length) {
    throw new Error(`e2e/support/spec-groups.ts names specs that do not exist: ${missing.join(', ')}`);
  }

  return names.map((name) => `**/e2e/tests/${name}.e2e.ts`);
}

/** The `parallel` project: specs that share the appliance with every other one running. */
export const parallelSpecs = specGlobs([
  'acme-dns-authenticators',
  'alert-services-page',
  'alert-services',
  'api-keys-edit',
  'api-keys',
  'certificates-import',
  'certificates',
  'containers-id-mapping',
  'cron-jobs',
  'cron-list-page',
  'dashboard',
  'dataset-acl-custom-presets',
  'dataset-acl-nfsv4-entries',
  'dataset-acl-nfsv4-presets',
  'dataset-acl-nfsv4-recursive',
  'dataset-acl-posix',
  'dataset-acl-validation',
  'dataset-capacity-settings',
  'dataset-permissions',
  'dataset-promote',
  'dataset-quotas-more',
  'dataset-quotas',
  'datasets-deletion',
  'datasets-encryption-export-key',
  'datasets-encryption-options',
  'datasets-encryption',
  'datasets-form',
  'global-search',
  'groups-deletion',
  'groups-edit',
  'groups-form',
  'groups-members',
  'init-shutdown-list-page',
  'init-shutdown-scripts',
  'iscsi-targets-extents',
  'kerberos-list-pages',
  'kerberos',
  'pool-wizard-validation',
  'privileges',
  'reporting-tabs',
  'reporting',
  's3-access-key-management',
  's3-access-key-options',
  's3-bucket-management',
  's3-list-page',
  'save-config',
  'smoke',
  'snapshot-create',
  'user-details',
  'users-deletion',
  'users-edit',
  'users-form',
  'virtual-machines-devices',
  'virtual-machines',
  'zvols',
]);

/**
 * The `data-protection` project: specs that share the appliance with the
 * `parallel` ones, but run one at a time among themselves.
 *
 * They break each other, not anything else. The Data Protection cards list four
 * tasks before their pager, and these specs count every task of a kind, act on
 * card rows, or expect a card empty — so two of them at once push each other's
 * rows off. Several also lean on `fixtures/loopback-ssh.ts`, which starts SSH,
 * stops it again when it started it, and rewrites root's authorized keys;
 * between two workers, one would stop SSH under the other. The run lookups in
 * `fixtures/replication-tasks.ts` and `fixtures/rsync-tasks.ts` match jobs by a
 * task id middleware reuses once a task is deleted, which only holds while no
 * other spec is deleting tasks of that kind.
 *
 * So a spec that creates any of these — periodic snapshot, replication, rsync,
 * cloud sync or TrueCloud Backup tasks, cloud credentials, SSH keypairs or
 * connections — or touches SSH or root's keys belongs here or in `serial`,
 * never in {@link parallelSpecs}.
 */
export const dataProtectionSpecs = specGlobs([
  'cloud-backup-tasks',
  'cloud-credentials',
  'cloud-sync-task-list',
  'cloud-sync-tasks',
  'data-protection-dashboard',
  'dataset-snapshot-tasks-link',
  'periodic-snapshot-tasks',
  'replication-form-options',
  'replication-settings',
  'replication-ssh',
  'replication-task-list',
  'replication-tasks',
  'rsync-task-list',
  'rsync-task-run',
  'rsync-task-ssh',
  'rsync-task-state',
  'rsync-tasks',
  'snapshot-task-list',
  'snapshot-task-options',
  'snapshot-task-retention',
  'snapshot-task-validation',
  'ssh-connections',
  'ssh-keypairs',
]);
