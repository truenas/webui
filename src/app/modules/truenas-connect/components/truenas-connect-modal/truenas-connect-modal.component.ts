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
import { WebSocketService } from 'app/services/ws.service';
import { of } from 'rxjs';

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

  constructor(@Inject(WINDOW) private window: Window, private ws: WebSocketService, private loader: AppLoaderService) {}


  connect() {
    this.loader.open()
    // TODO: send websocket call
    const response: TruenasConnectRegistration = {
      version: '24.10.0',
      model: EnclosureModel.M40,
      token: 'bbc164c0-ee7f-4a36-861b-7cf4c05ca411' + Math.floor(Math.random() * 101),
      system_id: 'c4a1f58a-ec7e-45e0-8753-d9d5c7b4812d' + Math.floor(Math.random() * 101)
    }
    of(response).subscribe(() => {
      this.window.open(`https://truenas.connect.dev.ixsystems.net/en/system/register?version=${response.version}&model=${response.model}&system_id=${response.system_id}&token=${response.token}`)
    })
    this.loader.close()
  }
}
