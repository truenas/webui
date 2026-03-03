import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ChangeTierDialogData {
  datasetName: string;
  currentTier: DatasetTier;
  poolName: string;
}

@Component({
  selector: 'ix-change-tier-dialog',
  templateUrl: './change-tier-dialog.component.html',
  styleUrls: ['./change-tier-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    TranslateModule,
    ReactiveFormsModule,
    IxCheckboxComponent,
    TestDirective,
  ],
})
export class ChangeTierDialogComponent implements OnInit {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ChangeTierDialogComponent>);
  private destroyRef = inject(DestroyRef);
  protected data = inject<ChangeTierDialogData>(MAT_DIALOG_DATA);

  protected form = this.fb.group({
    moveExistingData: [true],
  });

  protected regularAvailable = signal<string | null>(null);
  protected performanceAvailable = signal<string | null>(null);

  get newTier(): DatasetTier {
    return this.data.currentTier === DatasetTier.Performance
      ? DatasetTier.Regular
      : DatasetTier.Performance;
  }

  get currentTierLabel(): string {
    return this.data.currentTier === DatasetTier.Performance ? 'Performance' : 'Regular';
  }

  get newTierLabel(): string {
    return this.newTier === DatasetTier.Performance ? 'Performance' : 'Regular';
  }

  protected currentTierSpace(): string | null {
    return this.data.currentTier === DatasetTier.Performance
      ? this.performanceAvailable()
      : this.regularAvailable();
  }

  protected newTierSpace(): string | null {
    return this.newTier === DatasetTier.Performance
      ? this.performanceAvailable()
      : this.regularAvailable();
  }

  ngOnInit(): void {
    this.loadPoolSpace();
  }

  protected onApply(): void {
    if (this.form.value.moveExistingData) {
      this.api.job('zfs.tier.rewrite_job_create', [{ dataset_name: this.data.datasetName }]).pipe(
        this.loader.withLoader(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
    } else {
      this.api.call('pool.dataset.set_tier', [this.data.datasetName, this.newTier]).pipe(
        this.loader.withLoader(),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
    }
  }

  private loadPoolSpace(): void {
    this.api.call('pool.query', [[[['name', '=', this.data.poolName]]]])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pools) => {
          if (!pools.length) return;
          const pool = pools[0];

          this.regularAvailable.set(buildNormalizedFileSize(pool.available, 'B', 2));
          if (pool.special_class_available > 0) {
            this.performanceAvailable.set(buildNormalizedFileSize(pool.special_class_available, 'B', 2));
          }
        },
      });
  }
}
