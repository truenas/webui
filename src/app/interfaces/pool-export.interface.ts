export type PoolExportParams = [
  id: string,
  params: {
    cascade: boolean;
    destroy: boolean;
    restart_services: boolean;
  },
];
