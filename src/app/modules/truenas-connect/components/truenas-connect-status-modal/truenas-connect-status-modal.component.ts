import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions,
  MatDialog,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-status-modal',
  standalone: true,
  imports: [
    MatDivider,
    MatDialogTitle,
    MatDialogContent,
    IxIconComponent,
    MatButton,
    MatDialogActions,
    TranslateModule,
  ],
  templateUrl: './truenas-connect-status-modal.component.html',
  styleUrl: './truenas-connect-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusModalComponent {
  readonly TruenasConnectStatus = TruenasConnectStatus;

  constructor(
    @Inject(WINDOW) private window: Window,
    private matDialog: MatDialog,
    protected tnc: TruenasConnectService,
  ) { }

  protected openSettings(): void {
    this.matDialog
      .open(TruenasConnectModalComponent, {
        width: '456px',
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected open(): void {
    this.window.open(this.tnc.config().tnc_base_url);
  }
}
