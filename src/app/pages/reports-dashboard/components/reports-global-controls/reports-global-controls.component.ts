import {
  Component,
} from '@angular/core';
import { GlobalAction } from 'app/interfaces/global-action.interface';

@Component({
  selector: 'reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
})
export class ReportsGlobalControlsComponent implements GlobalAction {
  config: any; // Reports page

  applyConfig(conf: any): void {
    this.config = conf;
  }
}
