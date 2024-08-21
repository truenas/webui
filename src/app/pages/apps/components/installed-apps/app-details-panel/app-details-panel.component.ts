import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { App } from 'app/interfaces/app.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  styleUrls: ['./app-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsPanelComponent {
  readonly app = input<App>();
  readonly status = input<AppStatus>();

  readonly startApp = output();
  readonly stopApp = output();
  readonly closeMobileDetails = output();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
