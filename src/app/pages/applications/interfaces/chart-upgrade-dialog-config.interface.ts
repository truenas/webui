import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

export interface ChartUpgradeDialogConfig {
  appInfo: ChartRelease;
  upgradeSummary: UpgradeSummary;
}
