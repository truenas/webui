export type AppStartQueryParams = [
  name: string,
];

export type AppDeleteParams = [
  string,
  {
    remove_images?: boolean;
    remove_ix_volumes?: boolean;
  },
];

export interface ChartRollbackParams {
  force_rollback?: boolean;
  recreate_resources?: boolean;
  rollback_snapshot?: boolean;
  app_version: string;
}
