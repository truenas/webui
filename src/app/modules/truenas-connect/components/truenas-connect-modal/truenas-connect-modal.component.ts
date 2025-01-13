import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { TruenasConnectRegistration } from 'app/interfaces/truenas-connect.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { of, switchMap } from 'rxjs';

@Component({
  selector: 'ix-truenas-connect-modal',
  standalone: true,
  imports: [TranslateModule, MatDialogTitle, MatDialogContent, MatDialogActions,IxIconComponent, TranslateModule, MatButton],
  templateUrl: './truenas-connect-modal.component.html',
  styleUrl: './truenas-connect-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TruenasConnectModalComponent {
  readonly helptext = helptextTopbar;
  protected readonly requiredRoles = [Role.TrueCommandWrite];

  constructor(@Inject(WINDOW) private window: Window, private api: ApiService, private loader: AppLoaderService) {}

  connect() {
    this.loader.open()
    this.api.call('tn_connect.ip_choices' as any, [])
      .pipe(
        switchMap(res => {
          const ips = Object.values(res)
          return this.api.call('tn_connect.update' as any, [{
              enabled: true,
              ips
            }])
        }),
        switchMap(() => {
          return this.api.call('tn_connect.generate_claim_token' as any, [])
        }),
        // TODO: need status to be REGISTRATION_FINALIZATION_WAITING
        // switchMap(() => {
        //   return this.api.call('tn_connect.get_registration_uri' as any, [])
        // })
      )
      .subscribe(url => {
        console.log('url', url)
        // this.window.open(url)
      })
  }
}
