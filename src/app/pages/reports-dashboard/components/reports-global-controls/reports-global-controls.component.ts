import {
  Component,
} from '@angular/core';
import { ReportTab } from 'app/enums/report-tab.enum';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';

@Component({
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
})
export class ReportsGlobalControlsComponent implements GlobalAction {
  readonly ReportTab = ReportTab;

  config: ReportsDashboardComponent; // Reports page

  applyConfig(conf: ReportsDashboardComponent): void {
    this.config = conf;
  }
}
