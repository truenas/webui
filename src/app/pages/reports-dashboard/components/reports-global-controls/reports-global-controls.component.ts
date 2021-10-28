import {
  Component,
} from '@angular/core';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';

@Component({
  selector: 'reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
})
export class ReportsGlobalControlsComponent implements GlobalAction {
  config: ReportsDashboardComponent; // Reports page

  applyConfig(conf: ReportsDashboardComponent): void {
    this.config = conf;
  }
}
