import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { map } from 'rxjs';
import { failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { RebootService } from 'app/services/reboot.service';
import { AppState } from 'app/store';
import { selectCanFailover, selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectOtherNodeRebootInfo, selectThisNodeRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';

@Component({
  selector: 'ix-reboot-required-dialog',
  templateUrl: './reboot-required-dialog.component.html',
  styleUrls: ['./reboot-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    ReactiveFormsModule,
    TnCheckboxComponent, TnFormFieldComponent,
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
    // Initial null instead of false keeps the required error from showing
    // before the user interacts with the checkbox.
    confirm: new FormControl<boolean | null>(null, Validators.requiredTrue),
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
