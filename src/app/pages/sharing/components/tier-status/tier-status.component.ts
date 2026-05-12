import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import {
  DataMigrationStatusDialogComponent,
} from 'app/pages/sharing/components/data-migration-status-dialog/data-migration-status-dialog.component';
import {
  getTierJobIcon, getTierJobStatusClass, getTierJobStatusLabelKey, getTierLabelKey,
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
    const key = getTierLabelKey(this.tier()?.tier_type);
    return key ? this.translate.instant(key) : '-';
  });

  protected tierJob = computed(() => this.tier()?.tier_job ?? null);
  protected jobIcon = computed(() => getTierJobIcon(this.tierJob()));
  protected jobStatusLabel = computed(() => {
    const key = getTierJobStatusLabelKey(this.tierJob());
    return key ? this.translate.instant(key) : '';
  });

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
