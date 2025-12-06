import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

@UntilDestroy()
@Component({
  selector: 'ix-truenas-connect-button',
  imports: [
    IxIconComponent,
    MatButtonModule,
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
  private truenasConnectService = inject(TruenasConnectService);

  tooltips = helptextTopbar.tooltips;

  protected showStatus(): void {
    this.truenasConnectService.openStatusModal();
  }
}
