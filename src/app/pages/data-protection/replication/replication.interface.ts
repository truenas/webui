export enum TransportMode {
  Legacy = 'LEGACY',
  Local = 'LOCAL',
  SSH = 'SSH',
  Netcat = 'SSH+NETCAT',
}

export enum ReadOnlyMode {
  Set = 'SET',
  Require = 'REQUIRE',
  Ignore = 'IGNORE',
}

export enum LoggingLevel {
  Default = 'DEFAULT',
  Debug = 'DEBUG',
  Info = 'INFO',
  Warning = 'WARNING',
  Error = 'ERROR',
}

export enum RetentionPolicy {
  Source = 'SOURCE',
  Custom = 'CUSTOM',
  None = 'NONE',
}

export enum CompressionType {
  Disabled = 'DISABLED',
  LZ4 = 'LZ4',
  PIGZ = 'PIGZ',
  PLZIP = 'PLZIP',
}

export enum NetcatMode {
  Local = 'LOCAL',
  Remote = 'REMOTE',
}

export enum EncryptionKeyFormat {
  Hex = 'HEX',
  Passphrase = 'PASSPHRASE',
}

export enum LifetimeUnit {
  Hour = 'HOUR',
  Day = 'DAY',
  Week = 'WEEK',
  Month = 'MONTH',
  Year = 'YEAR',
}

export enum CipherType {
  Standard = 'STANDARD',
  Fast = 'FAST',
  Disabled = 'DISABLED',
}

export enum Direction {
  Push = 'PUSH',
  Pull = 'PULL',
}

export interface ReplicationState {
  state: string;
  datetime: any;
  error: string;
  last_snapshot: string | null;
}

export interface Schedule {
  minute: string;
  hour: string;
  dom: string;
  month: string;
  dow: string;
  begin: string;
  end: string;
}

export enum ScheduleMethod {
  Cron = 'cron',
  Once = 'once',
}

export interface SshCredentials {
  id?: string;
  host: string;
  port: number;
  username: string;
  private_key: number;
  remote_host_key: any;
  cipher: CipherType;
  connect_timeout: number;
}

export interface PeriodicSnapshotTask {
  schedule: Schedule | null;
}

export interface ReplicationTask {
  allow_from_scratch: boolean;
  also_include_naming_schema: any[];
  auto: boolean;
  compressed: boolean;
  compression: CompressionType | null;
  direction: Direction;
  embed: boolean;
  enabled: boolean;
  encryption: boolean;
  encryption_key: string | null;
  encryption_key_format: EncryptionKeyFormat | null;
  encryption_key_location: string | null;
  exclude: any[];
  hold_pending_snapshots: boolean;
  id: number;
  job?: any;
  large_block: boolean;
  lifetime_unit: LifetimeUnit;
  lifetime_value: number | null;
  logging_level: LoggingLevel;
  name: string;
  naming_schema: any[];
  netcat_active_side: NetcatMode | null;
  netcat_active_side_listen_address: string | null;
  netcat_active_side_port_max: number | null;
  netcat_active_side_port_min: number | null;
  netcat_passive_side_connect_address: string | null;
  only_matching_schedule: boolean;
  periodic_snapshot_tasks: number[] | PeriodicSnapshotTask[];
  properties: boolean;
  properties_exclude: string[];
  properties_override: {};
  readonly: ReadOnlyMode;
  recursive: boolean;
  replicate: boolean;
  restrict_schedule: Schedule;
  retention_policy: RetentionPolicy;
  retries: number;
  schedule: Schedule | boolean | null;
  schedule_method: ScheduleMethod;
  schedule_picker: string;
  source_datasets: string[];
  source_datasets_from: string;
  speed_limit: number | null;
  ssh_credentials: SshCredentials | number[] | null;
  state: ReplicationState;
  target_dataset: string;
  target_dataset_from: string;
  transport: TransportMode;
}
