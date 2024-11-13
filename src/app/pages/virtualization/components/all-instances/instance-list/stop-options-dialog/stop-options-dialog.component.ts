import {
  ChangeDetectionStrategy, Component, computed, Inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Option } from 'app/interfaces/option.interface';
import { VirtualizationStopParams } from 'app/interfaces/virtualization.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export enum StopOptionsOperation {
  Restart,
  Stop,
}

@UntilDestroy()
@Component({
  selector: 'ix-stop-dialog',
  templateUrl: './stop-options-dialog.component.html',
  styleUrls: ['./stop-options-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    IxCheckboxComponent,
    MatButton,
    MatDialogTitle,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    MatDialogClose,
    IxSelectComponent,
  ],
})
export class StopOptionsDialogComponent {
  protected readonly operation = signal(StopOptionsOperation.Stop);

  protected readonly isRestart = computed(() => this.operation() === StopOptionsOperation.Restart);

  protected readonly form = this.formBuilder.nonNullable.group({
    timeout: [-1],
    force: false,
  });

  protected readonly timeoutOptions$: Observable<Option[]> = of([
    {
      label: this.translate.instant('Wait for container to shut down cleanly'),
      value: -1,
    },
    {
      label: this.translate.instant('Wait for 30 seconds'),
      value: 30,
    },
    {
      label: this.translate.instant('Wait for 1 minute'),
      value: 60,
    },
    {
      label: this.translate.instant('Wait for 5 minutes'),
      value: 5 * 60,
    },
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<StopOptionsDialogComponent, VirtualizationStopParams | false>,
    @Inject(MAT_DIALOG_DATA) operation: StopOptionsOperation,
  ) {
    this.operation.set(operation);
  }

  protected onSubmit(): void {
    this.dialogRef.close(this.form.value as VirtualizationStopParams);
  }
}
