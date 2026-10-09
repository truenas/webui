/**
 * The parts of `src/` that have finished moving from `ApiService` to `TypedApiService`, and the
 * legacy modules they may no longer import.
 *
 * Shared by the two guardrails so they cannot disagree:
 *
 * - `eslint.config.mjs` turns each entry into a path-scoped `no-restricted-imports`, so a
 *   finished area cannot slide back to the legacy client.
 * - `scripts/check-api-migration.ts` counts what is left per area, and proves this list honest:
 *   an entry that no longer exists, or that still holds a legacy import the lint rule would have
 *   caught, fails the build — and so does an area that has finished migrating without being
 *   listed here, which is what keeps the list from going stale as the migration proceeds.
 *
 * `.mjs` because ESLint's flat config is ESM and loads it directly; `tsx` reads it just as well.
 *
 * See `docs/devs/typed-api-client.md` for how a call site moves.
 */

/**
 * Finished paths, relative to the repo root. A path ending in `.ts` is that one file; anything
 * else is a directory and covers everything below it, specs included — a spec that still scripts
 * `mockApi` is a call site that has not moved, whatever its component injects.
 *
 * Add an entry when the last legacy import in an area goes; `check-api-migration` will tell you
 * when that has happened and you have forgotten.
 */
export const migratedApiPaths = [
  // Phase 0's whole-feature pilot was Backup Credentials; NAS-144003 moved the rest of credentials —
  // certificates and ACME, groups, KMIP, privileges, S3 access keys, users and their API keys.
  'src/app/pages/credentials',
  // The two shared services the Backup Credentials page runs on. Both are consumed from
  // elsewhere as well (`ix-ssh-credentials-select`, the cloud sync forms), so they are pinned
  // as files rather than waiting for `src/app/services` as a whole.
  'src/app/services/cloud-credential.service.ts',
  'src/app/services/cloud-credential.service.spec.ts',
  'src/app/services/keychain-credential.service.ts',
  'src/app/services/keychain-credential.service.spec.ts',
  // NAS-143993: the core domain services. `src/app/services` itself cannot be pinned yet:
  // `network.service.ts` keeps `ApiService` for the two calls the typed client cannot make
  // (gap 14 and gap 5 in docs/devs/typed-api-client.md), so the rest are pinned file by file.
  'src/app/services/dataset',
  'src/app/services/global-store',
  'src/app/services/gpu',
  'src/app/services/disk-temperature.service.ts',
  'src/app/services/disk-temperature.service.spec.ts',
  'src/app/services/download.service.ts',
  'src/app/services/download.service.spec.ts',
  'src/app/services/failover-validation.service.ts',
  'src/app/services/failover-validation.service.spec.ts',
  'src/app/services/fibre-channel.service.ts',
  'src/app/services/fibre-channel.service.spec.ts',
  'src/app/services/filesystem.service.ts',
  'src/app/services/filesystem.service.spec.ts',
  'src/app/services/filesystem-zvols.service.spec.ts',
  'src/app/services/iscsi.service.ts',
  'src/app/services/license.service.ts',
  'src/app/services/license.service.spec.ts',
  'src/app/services/reboot.service.ts',
  'src/app/services/reboot.service.spec.ts',
  'src/app/services/redirect.service.ts',
  'src/app/services/replication.service.ts',
  'src/app/services/replication.service.spec.ts',
  'src/app/services/snapshot-task.service.ts',
  'src/app/services/storage.service.ts',
  'src/app/services/storage.service.spec.ts',
  'src/app/services/system-general.service.ts',
  'src/app/services/system-general.service.spec.ts',
  'src/app/services/user-directory.service.ts',
  'src/app/services/user-directory.service.spec.ts',
  'src/app/services/user.service.ts',
  'src/app/services/user.service.spec.ts',
  'src/app/services/vm.service.ts',
  'src/app/services/vm.service.spec.ts',
  // NAS-143994: the root NgRx effects — system info and config, entitlements, HA, reboot info,
  // services, EULA, network check-in and preferences.
  'src/app/store',
  // NAS-143995: the shared modules — alerts, dialogs, the top bar, form controls and TrueCommand.
  // `modules/dialog` and `modules/layout` are pinned below their roots: the job progress dialog
  // and the console footer tail logs through `filesystem.file_tail_follow`, an event source the
  // typed client cannot subscribe to yet (gap 5).
  'src/app/modules/alerts',
  'src/app/modules/dialog/components/error-dialog',
  'src/app/modules/dialog/components/multi-error-dialog',
  'src/app/modules/dialog/components/show-logs-dialog',
  'src/app/modules/dialog/components/start-service-dialog',
  'src/app/modules/forms',
  'src/app/modules/layout/topbar',
  'src/app/modules/truecommand',
  // Its only legacy dependant was a spec mocking `core.job_download_logs` for the logs dialog.
  'src/app/pages/jobs',
  // Nothing here imports a client; `pool-scan-event.helper.ts` names a generated event type.
  'src/app/helpers',
  // NAS-143996: sign-in, audit, reports and the dashboard. `pages/dashboard` is pinned below its
  // root: `WidgetResourcesService` keeps `ApiService` for `reporting.realtime` and `app.stats`,
  // event sources the typed client cannot subscribe to yet (gap 5).
  'src/app/pages/signin',
  'src/app/pages/audit',
  'src/app/pages/reports-dashboard',
  'src/app/pages/dashboard/components',
  'src/app/pages/dashboard/widgets',
  'src/app/pages/dashboard/services/dashboard.store.ts',
  'src/app/pages/dashboard/services/dashboard.store.spec.ts',
  // NAS-143997: directory services, the service config forms and the shutdown / restart / failover /
  // config reset pages. `pages/directory-service` and `pages/services` are pinned below their roots:
  // `kerberos.keytab.kerberos_principal_choices` (the credential step of the directory services
  // form) and `nfs.add_principal` (the NFS service's Add SPN dialog) are missing from the
  // generated directory (gap 14), so those two keep `ApiService`.
  'src/app/pages/directory-service/directory-services.component.ts',
  'src/app/pages/directory-service/directory-services.component.spec.ts',
  'src/app/pages/directory-service/components/directory-services-form/directory-services-form.component.ts',
  'src/app/pages/directory-service/components/directory-services-form/directory-services-form.component.spec.ts',
  'src/app/pages/directory-service/components/kerberos-keytabs',
  'src/app/pages/directory-service/components/kerberos-realms',
  'src/app/pages/directory-service/components/kerberos-realms-form',
  'src/app/pages/directory-service/components/leave-domain-dialog',
  'src/app/pages/services/services.component.ts',
  'src/app/pages/services/services.component.spec.ts',
  'src/app/pages/services/components/service-ftp',
  'src/app/pages/services/components/service-nfs/service-nfs.component.ts',
  'src/app/pages/services/components/service-nfs/service-nfs.component.spec.ts',
  'src/app/pages/services/components/service-s3',
  'src/app/pages/services/components/service-smb',
  'src/app/pages/services/components/service-snmp',
  'src/app/pages/services/components/service-ssh',
  'src/app/pages/services/components/service-status-cell',
  'src/app/pages/services/components/service-ups',
  'src/app/pages/services/components/service-webshare',
  'src/app/pages/system-tasks',
  // NAS-143998: virtual machines and containers. `pages/containers` is pinned below its root:
  // `ContainersStore` keeps `ApiService` for `container.metrics`, an event source middleware pushes
  // on a timer, which must not move while the typed client never releases a subscription (gap 17).
  'src/app/pages/vm',
  'src/app/pages/containers/components',
  'src/app/pages/containers/utils',
  'src/app/pages/containers/stores/container-config.store.ts',
  'src/app/pages/containers/stores/container-config.store.spec.ts',
  'src/app/pages/containers/stores/container-devices.store.ts',
  'src/app/pages/containers/stores/container-devices.store.spec.ts',
  // NAS-144000: data protection — cloud backup, cloud sync, periodic snapshot, rsync, replication
  // and VMware snapshot tasks, their cards, lists, forms and wizards.
  'src/app/pages/data-protection',
  // NAS-144001: datasets — the tree and details cards, the dataset and zvol forms, quotas, encryption,
  // permissions and ACL editing, and snapshots.
  'src/app/pages/datasets',
  // NAS-144002: storage — the pools dashboard and its cards, import, the pool creation wizard and Add VDEVs,
  // disks, VDEVs and hardware disk encryption. It absorbs the SED password entry pinned above.
  'src/app/pages/storage',
  // NAS-143999: apps. `pages/apps` is pinned below its root: `AppsStatsService` (`app.stats`) and the
  // resources card (`reporting.realtime`) keep `ApiService` for event sources middleware pushes on a
  // timer (gap 17), and the container logs tail `app.container_log_follow`, a parameterised
  // subscription the typed client cannot make yet (gap 5).
  'src/app/pages/apps/services',
  'src/app/pages/apps/components/app-detail-view/app-detail-view.component.ts',
  'src/app/pages/apps/components/app-detail-view/app-detail-view.component.spec.ts',
  'src/app/pages/apps/components/app-wizard',
  'src/app/pages/apps/components/available-apps',
  'src/app/pages/apps/components/catalog-settings',
  'src/app/pages/apps/components/custom-app-form',
  'src/app/pages/apps/components/docker-images',
  'src/app/pages/apps/components/docker-registries',
  'src/app/pages/apps/components/install-app-button',
  'src/app/pages/apps/components/installed-apps/installed-apps.component.ts',
  'src/app/pages/apps/components/installed-apps/installed-apps.component.spec.ts',
  'src/app/pages/apps/components/installed-apps/app-bulk-update',
  'src/app/pages/apps/components/installed-apps/app-info-card',
  'src/app/pages/apps/components/installed-apps/app-rollback-modal',
  'src/app/pages/apps/components/installed-apps/app-settings-button',
  'src/app/pages/apps/components/installed-apps/installed-apps-list',
  'src/app/pages/apps/components/select-pool-dialog',
  'src/app/pages/apps/store/apps-store.service.ts',
  'src/app/pages/apps/store/apps-store.service.spec.ts',
  'src/app/pages/apps/store/docker.store.ts',
  'src/app/pages/apps/store/docker.store.spec.ts',
  // NAS-144004: sharing — the shares dashboard and its cards, SMB, NFS, S3, WebShare, iSCSI (absorbing the wizard
  // steps pinned with the services above), Fibre Channel and NVMe-oF. `pages/sharing` is pinned below its root:
  // `SharingTierService` keeps `ApiService` for `zfs.tier.rewrite_job_query` and `zfs.tier.rewrite_job_status`,
  // event sources that take subscription params (gap 5), and the data migration dialog's spec builds the real
  // service.
  'src/app/pages/sharing/sharing.routes.ts',
  'src/app/pages/sharing/iscsi',
  'src/app/pages/sharing/nfs',
  'src/app/pages/sharing/nvme-of',
  'src/app/pages/sharing/s3',
  'src/app/pages/sharing/smb',
  'src/app/pages/sharing/utils',
  'src/app/pages/sharing/webshare',
  'src/app/pages/sharing/components/change-tier-dialog',
  'src/app/pages/sharing/components/shares-dashboard',
  'src/app/pages/sharing/components/testing',
  'src/app/pages/sharing/components/tier-status',
  'src/app/pages/sharing/components/tier-status.utils.ts',
  'src/app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component.ts',
];

/**
 * Paths that own both clients by definition, and so are never "finished" in the sense the
 * ratchet means. `check-api-migration` neither asks for them to be pinned nor would be right to:
 * a rule banning the legacy client from the legacy client's own module is nonsense, and the two
 * spec doubles have to outlive every call site they stand in for — `mockApi` is deleted in
 * Phase 3, after the last consumer, not before.
 *
 * `interfaces/` is here for a different reason: files there alias the client's generated types
 * (`keychain-credential.interface.ts` is the pattern) without injecting anything. They are typed
 * dependants of the client and not call sites, so treating the directory as a migrated area
 * would pin 300 interface files on the strength of three type aliases.
 */
export const apiMigrationExemptPaths = [
  'src/app/modules/websocket',
  'src/app/core/testing',
  'src/app/interfaces',
];

/**
 * What a finished path may not import, as `no-restricted-imports` patterns.
 *
 * Both halves of the legacy client are named: the service itself, and `mockApi` — its spec
 * double is the only way a migrated component's spec can still be talking to the old dispatcher.
 *
 * Matched with a leading `**` rather than the exact `app/...` alias so a relative spelling of the
 * same module is rejected too.
 */
export const legacyApiImportPatterns = [
  '**/modules/websocket/api.service',
  '**/core/testing/utils/mock-api.utils',
];

/** The same, as a regular expression, for the script — which reads import lines as text. */
export const legacyApiImportPattern = /from '[^']*(?:modules\/websocket\/api\.service|core\/testing\/utils\/mock-api\.utils)'/;

/**
 * The typed client's counterparts: the service, the client token and the `mockTypedApi` double.
 * `typed-api/` covers the first two, and is deliberately a prefix — the token file is how a call
 * site names a generated type (`CallResponse<WebUiApiDirectory, …>`) without injecting anything.
 */
export const typedApiImportPattern = /from '[^']*(?:modules\/websocket\/typed-api\/[^']*|core\/testing\/(?:utils\/mock-typed-api\.utils|classes\/mock-typed-api\.service))'/;

/** Each finished path as an ESLint `files` pattern. */
export function migratedApiFilePatterns() {
  return migratedApiPaths.map((path) => (path.endsWith('.ts') ? path : `${path}/**/*.ts`));
}

/** Whether a repo-relative file sits inside a finished path. */
export function isMigratedPath(file) {
  return migratedApiPaths.some((path) => file === path || file.startsWith(`${path}/`));
}

/** Whether a repo-relative path is infrastructure the ratchet leaves alone. */
export function isExemptPath(file) {
  return apiMigrationExemptPaths.some((path) => file === path || file.startsWith(`${path}/`));
}
