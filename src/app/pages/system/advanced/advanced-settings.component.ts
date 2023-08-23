import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent {
  constructor(private ws: WebSocketService) {}

  isSystemLicensed$: Observable<null | object> = this.ws.call('system.license');
}
