import { CallResponse } from '@truenas/api-client';
import { DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { renamedProperties, toLegacyZfsProperty } from 'app/services/dataset/zfs-resource.utils';

export type WebUiDatasetDetailsEntry = CallResponse<WebUiApiDirectory, 'webui.dataset.details'>[number];
type ZfsPropertyValue = Parameters<typeof toLegacyZfsProperty>[1];

/*
 * `webui.dataset.details` returns a flat list with native ZFS properties (`{ value, raw, source }`), consumers under
 * `consumers` and task counts under `tasks`. The datasets page is written against what `pool.dataset.details`
 * returned, so each row is read into that shape here, by the same rules `zfsResourceToDataset` uses for
 * `zfs.resource.list`. A consumer list or count the caller may not see stays `null`, so the page can hide it.
 */

function toDatasetDetailsRow(row: WebUiDatasetDetailsEntry): DatasetDetails {
  const properties = row.properties as Record<string, ZfsPropertyValue | undefined>;
  const details: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    pool: row.pool,
    type: row.type as DatasetType,
  };

  Object.entries(properties).forEach(([nativeName, property]) => {
    if (!property || nativeName === 'mountpoint' || nativeName === 'encryptionroot') {
      return;
    }
    const name = renamedProperties[nativeName] ?? nativeName;
    details[name] = toLegacyZfsProperty(name, property);
  });

  const encrypted = Boolean(properties.encryption && properties.encryption.raw !== 'off');
  const keystatus = properties.keystatus?.raw;

  return {
    ...details,
    mountpoint: row.type === 'FILESYSTEM' ? properties.mountpoint?.raw ?? null : null,
    encrypted,
    locked: encrypted && keystatus === 'unavailable',
    key_loaded: encrypted && keystatus === 'available',
    encryption_root: encrypted ? properties.encryptionroot?.raw ?? null : null,
    user_properties: Object.fromEntries(
      Object.entries(row.user_properties).map(([key, value]) => [key, {
        parsed: value,
        rawvalue: value,
        value,
        source: ZfsPropertySource.Local,
      }]),
    ),
    tier: row.tier as SharingTierInfo | null,
    snapshot_count: row.snapshot_count,
    thick_provisioned: row.thick_provisioned,
    smb_shares: row.consumers.smb,
    nfs_shares: row.consumers.nfs,
    webshare_shares: row.consumers.webshare,
    iscsi_shares: row.consumers.iscsi,
    nvmet_shares: row.consumers.nvmet,
    vms: row.consumers.vms,
    containers: row.consumers.containers,
    apps: row.consumers.apps,
    snapshot_tasks_count: row.tasks.snapshot,
    replication_tasks_count: row.tasks.replication,
    cloudsync_tasks_count: row.tasks.cloudsync,
    rsync_tasks_count: row.tasks.rsync,
    children: [],
    // The properties are copied in by name above, which the compiler cannot follow.
  } as unknown as DatasetDetails;
}

/**
 * Reads `webui.dataset.details` into what `pool.dataset.details` returned: every dataset in one list, parents before
 * children and siblings by name (the order middleware sends), each with its own children nested under `children`.
 * The tree renders the list and reads `children` to tell which rows expand. A dataset whose parent isn't listed
 * (an internal dataset is left out) is nested under its nearest listed ancestor.
 */
export function toDatasetDetails(rows: WebUiDatasetDetailsEntry[]): DatasetDetails[] {
  const byName = new Map<string, DatasetDetails>();

  return rows.map((row) => {
    const dataset = toDatasetDetailsRow(row);
    byName.set(dataset.name, dataset);

    let parent: DatasetDetails | undefined;
    let parentName = dataset.name;
    while (!parent && parentName.includes('/')) {
      parentName = parentName.slice(0, parentName.lastIndexOf('/'));
      parent = byName.get(parentName);
    }
    parent?.children?.push(dataset);

    return dataset;
  });
}
