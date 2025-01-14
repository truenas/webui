import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-truenas-connect-modal',
  standalone: true,
  imports: [
    TranslateModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    IxIconComponent,
    TranslateModule,
    MatButton,
  ],
  templateUrl: './truenas-connect-modal.component.html',
  styleUrl: './truenas-connect-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectModalComponent {
  readonly helptext = helptextTopbar;
  protected readonly requiredRoles = [Role.TrueCommandWrite];

  constructor(@Inject(WINDOW) private window: Window, private api: ApiService, private loader: AppLoaderService) {}

  connect(): void {
    this.loader.open();
    this.api.call('tn_connect.ip_choices')
      .pipe(
        switchMap((ipsRes) => {
          const ips = Object.values(ipsRes);
          return this.api.call('tn_connect.update', [{
            enabled: true,
            ips,
          }]);
        }),
        switchMap(() => {
          return this.api.call('tn_connect.generate_claim_token');
        }),
        // TODO: need status to be REGISTRATION_FINALIZATION_WAITING
        // switchMap(() => {
        //   return this.api.call('tn_connect.get_registration_uri' as any, [])
        // })
        untilDestroyed(this),
      )
      .subscribe(() => {
        // this.window.open(url)
      });
  }
}
