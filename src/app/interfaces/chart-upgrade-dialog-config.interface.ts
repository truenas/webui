import { UpgradeSummary } from 'app/interfaces/application.interface';
import { App } from 'app/interfaces/chart-release.interface';

export interface ChartUpgradeDialogConfig {
  appInfo: App;
  upgradeSummary: UpgradeSummary;
}
