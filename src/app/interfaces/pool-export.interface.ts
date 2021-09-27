export type PoolExportParams = [
  id: number,
  params: {
    cascade: boolean;
    destroy: boolean;
    restart_services: boolean;
  },
];
