import { Direction } from 'app/enums/direction.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationCreate } from 'app/interfaces/replication-task.interface';

export const expectedNewReplication = {
  name: 'test',
  transport: TransportMode.Local,
  retries: 5,
  enabled: true,
  large_block: true,
  compressed: true,
  recursive: false,
  properties: true,
  replicate: false,
  properties_override: {
    overide: 'true',
  },
  // TODO: Check
  properties_exclude: ['exclude'],
  periodic_snapshot_tasks: [],
  also_include_naming_schema: ['%Y%m%d%H%M'],
  readonly: ReadOnlyMode.Require,
  encryption: false,
  retention_policy: RetentionPolicy.None,
  auto: true,
  schedule: {
    minute: '0',
    hour: '*',
    dom: '*',
    month: '*',
    dow: '*',
    begin: '00:00',
    end: '23:59',
  },
  only_matching_schedule: false,
  direction: Direction.Push,
  source_datasets: [
    'local1',
    'local2',
  ],
  target_dataset: 'local2',
} as ReplicationCreate;
