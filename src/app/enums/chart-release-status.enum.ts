export enum ChartReleaseStatus {
  Active = 'ACTIVE',
  Deploying = 'DEPLOYING',
  Stopped = 'STOPPED',
}

export const chartStatusIcons = new Map<ChartReleaseStatus, string>([
  [ChartReleaseStatus.Active, 'mdi-check-circle'],
  [ChartReleaseStatus.Deploying, 'mdi-progress-wrench'],
  [ChartReleaseStatus.Stopped, 'mdi-stop-circle'],
]);
