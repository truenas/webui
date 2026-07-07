import { ChangeDetectionStrategy, Component, DestroyRef, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardComponent, TnTestIdDirective, type TnCardAction } from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
    TnTestIdDirective,
    UiSearchDirective,
    TranslateModule,
    RouterLink,
  ],
})
export class DataProtectionCardComponent {
  private slideIn = inject(SlideIn);
  private snackbarService = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.SnapshotWrite];
  protected readonly searchableElements = dataProtectionCardElements;

  private hasSnapshotWrite = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected readonly addSnapshotAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasSnapshotWrite()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Take Snapshot'),
      testId: 'create-snapshot',
      handler: () => this.addSnapshot(),
    };
  });

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

  private addSnapshot(): void {
    this.slideIn.open(SnapshotAddFormComponent, { data: this.dataset().id })
      .onSuccess(() => {
        this.snackbarService.success(this.translate.instant('Snapshot added successfully.'));
      }, this.destroyRef);
  }
}
