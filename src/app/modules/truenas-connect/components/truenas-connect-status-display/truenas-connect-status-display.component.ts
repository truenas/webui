import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TncStatus, TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';

@Component({
  selector: 'ix-truenas-connect-status-display',
  imports: [
    TnIconComponent,
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
