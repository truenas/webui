export enum CatalogAppState {
  Active = 'ACTIVE',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
}

export const appStateIcons = new Map<CatalogAppState, string>([
  [CatalogAppState.Active, 'mdi-check-circle'],
  [CatalogAppState.Deploying, 'mdi-progress-wrench'],
  [CatalogAppState.Stopped, 'mdi-stop-circle'],
]);
