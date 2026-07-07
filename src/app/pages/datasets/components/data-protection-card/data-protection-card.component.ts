import { ChangeDetectionStrategy, Component, Type, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { dataProtectionCardElements } from 'app/pages/datasets/components/data-protection-card/data-protection-card.elements';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    UiSearchDirective,
    TranslateModule,
    MatCardContent,
    RouterLink,

  ],
})
export class DataProtectionCardComponent {
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.SnapshotWrite];
  protected readonly searchableElements = dataProtectionCardElements;

  // FormSidePanelService.open() expects Type<SidePanelForm>, but SnapshotAddFormComponent
  // structurally provides the host surface (canSubmit/submit/closed) without extending it —
  // mirroring how FormSidePanelService.openForm casts the renderer.
  private readonly snapshotAddForm = SnapshotAddFormComponent as unknown as Type<SidePanelForm>;

  get backupTasksLabel(): string {
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
  }

  addSnapshot(): void {
    this.formPanel.open(this.snapshotAddForm, {
      title: this.translate.instant('Add Snapshot'),
      inputs: { datasetPreset: this.dataset().id },
    });
  }
}
