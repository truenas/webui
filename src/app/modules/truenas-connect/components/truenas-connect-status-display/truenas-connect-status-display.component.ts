import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';

@Component({
  selector: 'ix-truenas-connect-status-display',
  imports: [
    IxIconComponent,
    TranslateModule,
    TestDirective,
    TruenasConnectSpinnerComponent,
  ],
  templateUrl: './truenas-connect-status-display.component.html',
  styleUrl: './truenas-connect-status-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectStatusDisplayComponent {
  readonly TncStatus = TncStatus;
  readonly TruenasConnectStatusReason = TruenasConnectStatusReason;

  status = input.required<typeof TncStatus[keyof typeof TncStatus]>();
  rawStatus = input.required<TruenasConnectStatus>();
}
