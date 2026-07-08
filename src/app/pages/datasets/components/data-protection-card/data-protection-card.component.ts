import { ChangeDetectionStrategy, Component, DestroyRef, computed, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnTestIdDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { dataProtectionCardElements } from 'app/pages/datasets/components/data-protection-card/data-protection-card.elements';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

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
    RequiresRolesDirective,
    TranslateModule,
    RouterLink,
  ],
})
export class DataProtectionCardComponent {
  private formPanel = inject(FormSidePanelService);
  private snackbarService = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.SnapshotWrite];
  protected readonly searchableElements = dataProtectionCardElements;

  protected readonly backupTasksLabel = computed<string>(() => {
    const replicationCount = this.dataset()?.replication_tasks_count || 0;
    const cloudSyncCount = this.dataset()?.cloudsync_tasks_count || 0;
    const rsyncCount = this.dataset()?.rsync_tasks_count || 0;

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

    if (parts.length === 0) {
      return this.translate.instant('No Backup Tasks');
    }

    return parts.join(', ');
  });

  addSnapshot(): void {
    this.formPanel.open(SnapshotAddFormComponent, {
      title: this.translate.instant('Add Snapshot'),
      inputs: { presetDatasetId: this.dataset().id },
    })
      .onSuccess(() => {
        this.snackbarService.success(this.translate.instant('Snapshot added successfully.'));
      }, this.destroyRef);
  }
}
