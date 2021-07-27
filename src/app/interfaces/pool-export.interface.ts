export type PoolExportParams = [
  /* id */ string,
  {
    cascade: boolean;
    destroy: boolean;
    restart_services: boolean;
  },
];
