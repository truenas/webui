import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
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

@Component({
  selector: 'ix-reboot-required-dialog',
  templateUrl: './reboot-required-dialog.component.html',
  styleUrls: ['./reboot-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The footer only renders actions when there are reboot reasons; hide the
  // empty action bar otherwise (the action container stays projected).
  host: { '[class.no-footer-actions]': '!thisNodeRebootReasons()?.length && !otherNodeRebootReasons()?.length' },
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxCheckboxComponent,
    TestDirective,
    MapValuePipe,
    FormActionsComponent,
  ],
})
export class RebootRequiredDialog {
  private store$ = inject<Store<AppState>>(Store);
  private reboot = inject(RebootService);
  private fb = inject(NonNullableFormBuilder);
  protected dialogRef = inject<DialogRef<boolean, RebootRequiredDialog>>(DialogRef);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

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

  rebootLocalNode(): void {
    this.reboot.restart(this.translate.instant('Active Controller Update Reboot'));
  }

  rebootRemoteNode(): void {
    this.reboot.restartRemote().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dialogRef.close();
    });
  }
}
