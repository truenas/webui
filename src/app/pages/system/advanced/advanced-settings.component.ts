import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  Observable,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { advancedSettingsElements } from 'app/pages/system/advanced/advanced-settings.elements';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent {
  isSystemLicensed$: Observable<boolean> = this.ws.call('system.security.info.fips_available');
  protected readonly Role = Role;
  protected readonly searchableElements = advancedSettingsElements;

  constructor(private ws: WebSocketService) {}
}
