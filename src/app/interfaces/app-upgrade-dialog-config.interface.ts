import { App } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';

export interface AppUpgradeDialogConfig {
  appInfo: App;
  upgradeSummary: AppUpgradeSummary;
}
