import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-button',
  imports: [
    IxIconComponent,
    MatButtonModule,
    MatBadgeModule,
    MatIconButton,
    MatTooltip,
    TranslateModule,
    TestDirective,
  ],
  templateUrl: './truenas-connect-button.component.html',
  styleUrl: './truenas-connect-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectButtonComponent {
  readonly TruenasConnectStatus = TruenasConnectStatus;
  tooltips = helptextTopbar.tooltips;

  constructor(private matDialog: MatDialog, public tnc: TruenasConnectService) {
  }

  protected showStatus(): void {
    this.matDialog.open(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: {
        top: '48px',
        right: '16px',
      },
    });
  }
}
