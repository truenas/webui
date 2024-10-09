export enum CatalogAppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
  Crashed = 'CRASHED',
  Stopping = 'STOPPING',
}

export const appStateIcons = new Map<CatalogAppState, string>([
  [CatalogAppState.Running, 'mdi-check-circle'],
  [CatalogAppState.Deploying, 'mdi-progress-wrench'],
  [CatalogAppState.Stopping, 'mdi-progress-wrench'],
  [CatalogAppState.Stopped, 'mdi-stop-circle'],
  [CatalogAppState.Crashed, 'mdi-alert-circle'],
]);
