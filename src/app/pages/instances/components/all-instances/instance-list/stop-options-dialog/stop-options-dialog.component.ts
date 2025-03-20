import {
  ChangeDetectionStrategy, Component, computed, Inject, signal,
} from '@angular/core';
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
import { Option } from 'app/interfaces/option.interface';
import { VirtualizationStopParams } from 'app/interfaces/virtualization.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export enum StopOptionsOperation {
  Restart,
  Stop,
}

enum WaitFor {
  Force = 'force',
  Timeout30 = '30',
  Timeout60 = '60',
  Timeout300 = '300',
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
    MatButton,
    MatDialogTitle,
    ReactiveFormsModule,
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
    waitFor: [WaitFor.Timeout30],
  });

  protected readonly waitForOptions$: Observable<Option[]> = toObservable(this.isRestart).pipe(
    map((isRestart) => {
      return [
        {
          label: isRestart
            ? this.translate.instant('Force restart now')
            : this.translate.instant('Force shutdown now'),
          value: WaitFor.Force,
        },
        {
          label: this.translate.instant('Wait for 30 seconds'),
          value: WaitFor.Timeout30,
        },
        {
          label: this.translate.instant('Wait for 1 minute'),
          value: WaitFor.Timeout60,
        },
        {
          label: this.translate.instant('Wait for 5 minutes'),
          value: WaitFor.Timeout300,
        },
      ];
    }),
  );

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<StopOptionsDialogComponent, VirtualizationStopParams | false>,
    @Inject(MAT_DIALOG_DATA) operation: StopOptionsOperation,
  ) {
    this.operation.set(operation);
  }

  protected onSubmit(): void {
    const waitFor = this.form.value.waitFor;

    const params: VirtualizationStopParams = {
      timeout: -1,
      force: false,
    };

    switch (waitFor) {
      case WaitFor.Force:
        params.force = true;
        break;

      case WaitFor.Timeout30:
        params.timeout = 30;
        break;

      case WaitFor.Timeout60:
        params.timeout = 60;
        break;

      case WaitFor.Timeout300:
        params.timeout = 300;
        break;

      default:
        assertUnreachable(waitFor);
    }

    this.dialogRef.close(params);
  }
}
