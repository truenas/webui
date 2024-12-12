import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';

@Component({
  selector: 'ix-alert-settings',
  templateUrl: './alert-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AlertServiceListComponent, AlertConfigFormComponent],
})
export class AlertSettingsComponent {}
