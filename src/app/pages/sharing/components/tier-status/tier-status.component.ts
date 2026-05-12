import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { DatasetTier } from 'app/enums/dataset-tier.enum';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import {
  getTierJobIcon, getTierJobStatusClass, getTierJobStatusLabel,
} from 'app/pages/sharing/components/tier-status.utils';

@Component({
  selector: 'ix-tier-status',
  templateUrl: './tier-status.component.html',
  styleUrls: ['./tier-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnIconComponent,
    MatTooltip,
    NgClass,
  ],
})
export class TierStatusComponent {
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);

  readonly tier = input<SharingTierInfo | null | undefined>();

  protected tierLabel = computed(() => {
    const value = this.tier();
    if (!value) return '-';
    switch (value.tier_type) {
      case DatasetTier.Performance:
        return this.translate.instant(T('Performance'));
      case DatasetTier.Regular:
        return this.translate.instant(T('Regular'));
      default:
        return '-';
    }
  });

  protected tierJob = computed(() => this.tier()?.tier_job ?? null);
  protected jobIcon = computed(() => getTierJobIcon(this.tierJob()));
  protected jobStatusLabel = computed(() => this.translate.instant(getTierJobStatusLabel(this.tierJob())));
  protected jobStatusClass = computed(() => getTierJobStatusClass(this.tierJob()));

  protected openMigrationDialog(event: Event): void {
    event.stopPropagation();
    const tier = this.tier();
    if (!tier?.tier_job) return;

    this.matDialog.open(DataMigrationStatusDialogComponent, {
      data: {
        tierJob: tier.tier_job,
        targetTier: tier.tier_type,
      },
    });
  }
}
