export interface ReplicationConfig {
  max_parallel_replication_tasks: number;
}

export type AdvancedConfigUpdate = Omit<ReplicationConfig, 'id'>;
