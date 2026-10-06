import { DatasetType } from 'app/enums/dataset.enum';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { VmwareState } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-status-cell/vmware-status-cell.component';

export interface MatchDatastoresWithDatasets {
  datastores: VmwareDatastore[];
  filesystems: VmwareFilesystem[];
}

export interface VmwareDatastore {
  name: string;
  description: string;
  filesystems: string[];
}

export interface VmwareFilesystem {
  type: DatasetType;
  name: string;
  description: string;
}

export interface VmwareSnapshot {
  id: number;
  datastore: string;
  filesystem: string;
  hostname: string;
  password: string;
  username: string;
  state: VmwareState;
}

/**
 * Reads a `vmware.query` row into the shape the data protection pages are written against. The generated
 * entry spells `state.state` as a wire literal and `state.datetime` as a string where the wire
 * sends a `$date` envelope (gap 15); it describes the same object.
 *
 * The cast checks nothing: a regenerated entry that drops or renames a field still compiles, and
 * reads `undefined`.
 */
export function toVmwareSnapshot(snapshot: WebUiQueryEntity<'vmware.query'>): VmwareSnapshot {
  return snapshot as unknown as VmwareSnapshot;
}
