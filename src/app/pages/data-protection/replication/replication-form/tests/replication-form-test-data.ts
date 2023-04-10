import { Direction } from 'app/enums/direction.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationCreate } from 'app/interfaces/replication-task.interface';

export const expectedNewReplication = {
  name: 'My new replication',
  direction: Direction.Push,
  transport: TransportMode.Ssh,
  retries: 5,
  enabled: true,
  ssh_credentials: 1,
  speed_limit: 500 * 1024 * 1024,
  large_block: true,
  compressed: true,
  recursive: false,
  properties: true,
  replicate: false,
  properties_override: {},
  properties_exclude: ['exclude'],
  also_include_naming_schema: [
    '%Y%m%d%H%M',
  ],
  hold_pending_snapshots: true,
  readonly: ReadOnlyMode.Require,
  encryption: false,
  retention_policy: RetentionPolicy.None,
  auto: false,
  only_matching_schedule: false,
  source_datasets: [
    'dataset1',
    'dataset2',
  ],
  target_dataset: 'dataset2',
} as ReplicationCreate;
