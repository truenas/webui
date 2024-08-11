export enum CatalogAppState {
  Running = 'RUNNING',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
}

export const appStateIcons = new Map<CatalogAppState, string>([
  [CatalogAppState.Running, 'mdi-check-circle'],
  [CatalogAppState.Deploying, 'mdi-progress-wrench'],
  [CatalogAppState.Stopped, 'mdi-stop-circle'],
]);
