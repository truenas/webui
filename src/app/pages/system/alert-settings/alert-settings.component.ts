import { ChangeDetectionStrategy, Component } from '@angular/core';
import { alertSettingsElements } from 'app/pages/system/alert-settings/alert-settings.elements';

@Component({
  templateUrl: './alert-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertSettingsComponent {
  protected readonly searchableElements = alertSettingsElements;
}
