import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-truenas-connect-modal',
  standalone: true,
  imports: [TranslateModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatIconButton, MatButton, IxIconComponent, TranslateModule],
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
    this.window.open('https://truenas.connect.dev.ixsystems.net/en/system/register?version=24.10.0&model=M40&system[…]5c7b4912d&token=bbc164c0-ee7f-4a36-861b-7cf4c05ca411')
    this.loader.close()
  }
}
