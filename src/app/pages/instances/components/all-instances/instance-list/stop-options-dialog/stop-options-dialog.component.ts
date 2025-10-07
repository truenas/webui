import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { VirtualizationStopParams } from 'app/interfaces/container.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export enum StopOptionsOperation {
  Restart,
  Stop,
}

enum StopMethod {
  Graceful = 'graceful',
  ForceAfterTimeout = 'force_after_timeout',
  ForceImmediately = 'force_immediately',
}

@UntilDestroy()
@Component({
  selector: 'ix-stop-dialog',
  templateUrl: './stop-options-dialog.component.html',
  styleUrls: ['./stop-options-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    MatButton,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    MatDialogClose,
    IxSelectComponent,
  ],
})
export class StopOptionsDialog {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private dialogRef = inject<MatDialogRef<StopOptionsDialog, VirtualizationStopParams | false>>(MatDialogRef);

  protected readonly operation = signal(StopOptionsOperation.Stop);

  protected readonly isRestart = computed(() => this.operation() === StopOptionsOperation.Restart);

  protected readonly form = this.formBuilder.nonNullable.group({
    stopMethod: [StopMethod.ForceAfterTimeout],
  });

  protected readonly stopMethodOptions$: Observable<Option[]> = toObservable(this.isRestart).pipe(
    map((isRestart) => {
      const baseLabel = isRestart ? 'restart' : 'stop';
      return [
        {
          label: this.translate.instant('Wait for graceful {action}', { action: baseLabel }),
          value: StopMethod.Graceful,
        },
        {
          label: this.translate.instant('Wait for graceful {action}, then force', { action: baseLabel }),
          value: StopMethod.ForceAfterTimeout,
        },
        {
          label: this.translate.instant('Force {action} immediately', { action: baseLabel }),
          value: StopMethod.ForceImmediately,
        },
      ];
    }),
  );

  constructor() {
    const operation = inject<StopOptionsOperation>(MAT_DIALOG_DATA);

    this.operation.set(operation);
  }

  protected onSubmit(): void {
    const stopMethod = this.form.getRawValue().stopMethod;

    const params: VirtualizationStopParams = {};

    switch (stopMethod) {
      case StopMethod.Graceful:
        // No flags set - wait for graceful shutdown
        break;

      case StopMethod.ForceAfterTimeout:
        params.force_after_timeout = true;
        break;

      case StopMethod.ForceImmediately:
        params.force = true;
        break;

      default:
        assertUnreachable(stopMethod);
    }

    this.dialogRef.close(params);
  }
}
