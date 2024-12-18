import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { mapToOptions } from 'app/helpers/options.helper';
import { Pool, PruneDedupTableParams } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

export enum PruneBy {
  Percentage = 'percentage',
  Age = 'age',
}

export const pruneByLabels = new Map<PruneBy, string>([
  [PruneBy.Percentage, T('Percentage')],
  [PruneBy.Age, T('Age')],
]);

@UntilDestroy()
@Component({
  selector: 'ix-prune-dedup-table-dialog',
  styleUrls: ['prune-dedup-table-dialog.component.scss'],
  templateUrl: './prune-dedup-table-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormActionsComponent,
    IxInputComponent,
    MatButton,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    IxRadioGroupComponent,
    MatDialogClose,
    MatSlider,
    MatSliderThumb,
    IxLabelComponent,
  ],
})
export class PruneDedupTableDialogComponent {
  protected form = this.formBuilder.group({
    pruneBy: [PruneBy.Percentage],
    percentage: [null as number, [Validators.min(1), Validators.max(100)]],
    days: [null as number],
  });

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private dialogRef: MatDialogRef<PruneDedupTableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) protected pool: Pool,
  ) {}

  protected readonly pruneByOptions$ = of(mapToOptions(pruneByLabels, this.translate));

  get isPruningByPercentage(): boolean {
    return this.form.value.pruneBy === PruneBy.Percentage;
  }

  submit(): void {
    const payload: PruneDedupTableParams = { pool_name: this.pool.name };
    if (this.form.value.pruneBy === PruneBy.Percentage) {
      payload.percentage = this.form.value.percentage;
    } else {
      payload.days = this.form.value.days;
    }

    const job$ = this.api.job('pool.ddt_prune', [payload]);
    this.dialog.jobDialog(job$, {
      title: this.translate.instant('Pruning Deduplication Table'),
      canMinimize: true,
    })
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Deduplication table pruned'));
        this.dialogRef.close(true);
      });
  }

  formatSliderAsPercentage(value: number): string {
    return `${value}%`;
  }
}
