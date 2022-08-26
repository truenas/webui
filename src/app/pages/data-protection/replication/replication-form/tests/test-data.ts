import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';

export const existingReplication = {
  id: 1,
  target_dataset: 'remote/target',
  recursive: false,
  compression: null,
  speed_limit: 100202020,
  enabled: true,
  direction: Direction.Push,
  transport: TransportMode.Local,
  source_datasets: [
    'source/dataset1',
    'source/dataset2',
  ],
  exclude: [],
  naming_schema: [],
  name_regex: 'snapshot-.*',
  auto: false,
  only_matching_schedule: false,
  readonly: ReadOnlyMode.Require,
  allow_from_scratch: false,
  hold_pending_snapshots: false,
  retention_policy: RetentionPolicy.None,
  lifetime_unit: null,
  lifetime_value: null,
  large_block: true,
  embed: false,
  compressed: true,
  retries: 2,
  logging_level: null,
  name: 'test',
  state: {
    state: JobState.Pending,
  },
  properties: true,
  properties_exclude: [],
  properties_override: {},
  replicate: false,
  encryption: false,
  encryption_key: null,
  encryption_key_format: null,
  encryption_key_location: null,
  ssh_credentials: 1,
  periodic_snapshot_tasks: [
    { id: 1 },
  ],
  also_include_naming_schema: [],
  schedule: {
    begin: '14:00',
    dom: '*',
    dow: '*',
    end: '23:59',
    hour: '*',
    minute: '0',
    month: '*',
  },
  restrict_schedule: null,
  job: null,
} as ReplicationTask;
