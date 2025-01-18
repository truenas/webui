import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogContent, MatDialogActions, MatDialogTitle,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { SelectOption } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

const customReasonValue = 'CUSTOM_REASON_VALUE';

@UntilDestroy()
@Component({
  selector: 'ix-reboot-or-shutdown-dialog',
  templateUrl: './reboot-or-shutdown-dialog.component.html',
  styleUrls: ['./reboot-or-shutdown-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogModule,
    MatButton,
    TranslateModule,
    TestDirective,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
  ],
})
export class RebootOrShutdownDialogComponent {
  form = this.fb.group({
    confirm: [false, Validators.requiredTrue],
    reason: ['', Validators.required],
    customReason: ['', Validators.required],
  });

  readonly reasonOptions$: Observable<SelectOption[]> = of([
    {
      label: this.translate.instant('Custom Reason'),
      value: customReasonValue,
    },
    {
      label: this.translate.instant('System Update'),
      hoverTooltip: this.translate.instant('Applying important system or security updates.'),
      value: 'System Update',
    },
    {
      label: this.translate.instant('Hardware Change'),
      hoverTooltip: this.translate.instant('Adding, removing, or changing hardware components.'),
      value: 'Hardware Change',
    },
    {
      label: this.translate.instant('Troubleshooting Issues'),
      hoverTooltip: this.translate.instant('Required reset to fix system operation issues.'),
      value: 'Troubleshooting Issues',
    },
    {
      label: this.translate.instant('Power Outage'),
      hoverTooltip: this.translate.instant('Unexpected power loss necessitating a restart.'),
      value: 'Power Outage',
    },
    {
      label: this.translate.instant('Maintenance Window'),
      hoverTooltip: this.translate.instant('Regularly scheduled system checks and updates.'),
      value: 'Maintenance Window',
    },
    {
      label: this.translate.instant('System Overload'),
      hoverTooltip: this.translate.instant('High usage necessitating a system reset.'),
      value: 'System Overload',
    },
    {
      label: this.translate.instant('Software Installation'),
      hoverTooltip: this.translate.instant('Required restart after new software installation.'),
      value: 'Software Installation',
    },
    {
      label: this.translate.instant('Performance Optimization'),
      hoverTooltip: this.translate.instant('Restart to improve system performance speed.'),
      value: 'Performance Optimization',
    },
    {
      label: this.translate.instant('Network Reset'),
      hoverTooltip: this.translate.instant('Restart to re-establish network connections.'),
      value: 'Network Reset',
    },
    {
      label: this.translate.instant('System Freeze'),
      hoverTooltip: this.translate.instant('Unresponsive system necessitating a forced restart.'),
      value: 'System Freeze',
    },
  ]);

  get title(): string {
    return this.isShutdown
      ? this.translate.instant('Shutdown')
      : this.translate.instant('Restart');
  }

  get buttonText(): string {
    return this.isShutdown
      ? this.translate.instant('Shut Down')
      : this.translate.instant('Restart');
  }

  constructor(
    public dialogRef: MatDialogRef<RebootOrShutdownDialogComponent>,
    private fb: FormBuilder,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public isShutdown = false,
  ) {
    this.form.controls.reason.valueChanges.pipe(untilDestroyed(this)).subscribe((reason) => {
      if (reason === customReasonValue) {
        this.form.controls.customReason.enable();
      } else {
        this.form.controls.customReason.disable();
      }
    });
  }

  onSubmit(): void {
    const formValue = this.form.value;
    const reason = formValue.reason === customReasonValue ? formValue.customReason : formValue.reason;
    this.dialogRef.close(reason);
  }
}
