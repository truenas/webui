import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
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
  protected estimatedRewriteSize = signal<string | null>(null);
  protected hasSnapshots = signal(false);
  protected shareUsage = signal<{ smb: string[]; nfs: number; webshare: string[] }>({
    smb: [],
    nfs: 0,
    webshare: [],
  });

  protected hasAnyShares = computed(() => {
    const usage = this.shareUsage();
    return usage.smb.length + usage.nfs + usage.webshare.length > 0;
  });

  get newTier(): DatasetTier {
    return this.data.currentTier === DatasetTier.Performance
      ? DatasetTier.Regular
      : DatasetTier.Performance;
  }

  get currentTierLabel(): string {
    return this.data.currentTier === DatasetTier.Performance ? T('Performance') : T('Regular');
  }

  get newTierLabel(): string {
    return this.newTier === DatasetTier.Performance ? T('Performance') : T('Regular');
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
    this.loadDetails();
    this.loadShareUsage();
  }

  protected onApply(): void {
    this.api.call('zfs.tier.dataset_set_tier', [{
      dataset_name: this.data.datasetName,
      tier_type: this.newTier,
      move_existing_data: this.form.value.moveExistingData,
    }]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  private loadDetails(): void {
    forkJoin([
      this.api.call('zpool.query', [{ properties: ['class_normal_available', 'class_special_available'] }]),
      this.api.call('pool.dataset.query', [[['id', '=', this.data.datasetName]]]),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([zpools, datasets]) => {
        const zpool = zpools.find((pool) => pool.name === this.data.poolName);
        if (zpool) {
          const regularAvailable = zpool.properties.class_normal_available?.value ?? 0;
          const specialAvailable = zpool.properties.class_special_available?.value ?? 0;
          this.regularAvailable.set(buildNormalizedFileSize(regularAvailable, 'B', 2));
          if (specialAvailable > 0) {
            this.performanceAvailable.set(buildNormalizedFileSize(specialAvailable, 'B', 2));
          }
        }

        if (datasets.length) {
          const dataset = datasets[0];
          this.estimatedRewriteSize.set(buildNormalizedFileSize(dataset.usedbydataset.parsed, 'B', 2));
          this.hasSnapshots.set(dataset.usedbysnapshots.parsed > 0);
        }
      },
    });
  }

  private loadShareUsage(): void {
    const mountpoint = `/mnt/${this.data.datasetName}`;

    forkJoin([
      this.api.call('sharing.smb.query', [[['path', '=', mountpoint]], { select: ['id', 'name'] }]),
      this.api.call('sharing.nfs.query', [[['path', '=', mountpoint]], { select: ['id'] }]),
      this.api.call('sharing.webshare.query', [[['path', '=', mountpoint]], { select: ['id', 'name'] }]),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ([smb, nfs, webshare]) => {
        this.shareUsage.set({
          smb: smb.map((share) => share.name),
          nfs: nfs.length,
          webshare: webshare.map((share) => share.name),
        });
      },
    });
  }
}
