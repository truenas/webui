import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { RebootService } from 'app/services/reboot.service';
import { AppState } from 'app/store';
import { selectCanFailover, selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectOtherNodeRebootInfo, selectThisNodeRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-reboot-required-dialog',
  templateUrl: './reboot-required-dialog.component.html',
  styleUrls: ['./reboot-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatDialogModule,
    IxCheckboxComponent,
    MatButton,
    TestDirective,
    MapValuePipe,
    FormActionsComponent,
  ],
})
export class RebootRequiredDialogComponent {
  thisNodeRebootReasons = toSignal(this.store$.select(selectThisNodeRebootInfo).pipe(
    map((info) => info?.reboot_required_reasons || []),
  ));

  otherNodeRebootReasons = toSignal(this.store$.select(selectOtherNodeRebootInfo).pipe(
    map((info) => info?.reboot_required_reasons || []),
  ));

  protected readonly disabledReasonExplanations = failoverDisabledReasonLabels;
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly canFailover = toSignal(this.store$.select(selectCanFailover));
  protected readonly failoverDisabledReasons = toSignal(this.store$.select(selectHaStatus).pipe(
    map((status) => status?.reasons || []),
  ));

  form = this.fb.group({
    confirm: [false, Validators.requiredTrue],
  });

  constructor(
    private store$: Store<AppState>,
    private reboot: RebootService,
    private fb: NonNullableFormBuilder,
    private dialogRef: MatDialogRef<RebootRequiredDialogComponent>,
  ) {}

  rebootLocalNode(): void {
    this.reboot.restart();
  }

  rebootRemoteNode(): void {
    this.reboot.restartRemote().pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogRef.close();
    });
  }
}
