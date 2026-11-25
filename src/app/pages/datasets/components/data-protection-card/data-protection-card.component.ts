import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnTestIdDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { dataProtectionCardElements } from 'app/pages/datasets/components/data-protection-card/data-protection-card.elements';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

function isKnownCount(count: number | null | undefined): boolean {
  return count !== null && count !== undefined;
}

@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnButtonComponent,
    RequiresRolesDirective,
    TnTestIdDirective,
    UiSearchDirective,
    TranslateModule,
    RouterLink,
  ],
})
export class DataProtectionCardComponent {
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.SnapshotWrite];
  protected readonly searchableElements = dataProtectionCardElements;

  /** A count is `null` when the user may not see it, and its row is left out. */
  protected readonly hasSnapshotCount = computed(() => isKnownCount(this.dataset().snapshot_count));
  protected readonly hasSnapshotTasksCount = computed(() => isKnownCount(this.dataset().snapshot_tasks_count));

  /**
   * The replication, cloud sync and rsync counts, or `null` to hide the row: when the user may see none of them,
   * or when the ones they may see are all zero, since "No Backup Tasks" would not be known to be true.
   */
  protected readonly backupTasksLabel = computed<string | null>(() => {
    const dataset = this.dataset();
    const counts = [dataset.replication_tasks_count, dataset.cloudsync_tasks_count, dataset.rsync_tasks_count];
    const [replicationCount, cloudSyncCount, rsyncCount] = counts.map((count) => count || 0);

    const parts: string[] = [];

    if (replicationCount > 0) {
      parts.push(
        this.translate.instant('{count, plural, one {# Replication Task} other {# Replication Tasks}}', { count: replicationCount }),
      );
    }
    if (cloudSyncCount > 0) {
      parts.push(
        this.translate.instant('{count, plural, one {# Cloud Sync Task} other {# Cloud Sync Tasks}}', { count: cloudSyncCount }),
      );
    }
    if (rsyncCount > 0) {
      parts.push(
        this.translate.instant('{count, plural, one {# Rsync Task} other {# Rsync Tasks}}', { count: rsyncCount }),
      );
    }

    if (parts.length) {
      return parts.join(', ');
    }

    return counts.some((count) => count === null) ? null : this.translate.instant('No Backup Tasks');
  });

  addSnapshot(): void {
    this.formPanel.open(SnapshotAddFormComponent, {
      title: this.translate.instant(helptextSnapshots.addTitle),
      inputs: { presetDatasetId: this.dataset().id },
    });
  }
}
