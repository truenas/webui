import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  EncryptionOptionsDialogData,
} from 'app/pages/datasets/modules/encryption/components/encryption-options-dialog/encryption-options-dialog-data.interface';
import {
  EncryptionOptionsDialogComponent,
} from 'app/pages/datasets/modules/encryption/components/encryption-options-dialog/encryption-options-dialog.component';
import { ExportAllKeysDialogComponent } from 'app/pages/datasets/modules/encryption/components/export-all-keys-dialog/export-all-keys-dialog.component';
import {
  ExportDatasetKeyDialogComponent,
} from 'app/pages/datasets/modules/encryption/components/export-dataset-key-dialog/export-dataset-key-dialog.component';
import {
  LockDatasetDialogComponent,
} from 'app/pages/datasets/modules/encryption/components/lock-dataset-dialog/lock-dataset-dialog.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { isEncryptionRoot, isPasswordEncrypted, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

// TODO: Add support for exporting all keys on root dataset.
// TODO: Bug with spaces in dataset name
@UntilDestroy()
@Component({
  selector: 'ix-zfs-encryption-card',
  templateUrl: './zfs-encryption-card.component.html',
  styleUrls: ['./zfs-encryption-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatTooltipModule,
    TranslateModule,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    RouterLink,
    MatCardContent,
    MatCardActions,
    MatAnchor,
  ],
})
export class ZfsEncryptionCardComponent {
  @Input() dataset: DatasetDetails;
  @Input() parentDataset: DatasetDetails | undefined;

  constructor(
    private matDialog: MatDialog,
    private translate: TranslateService,
    private datasetStore: DatasetTreeStore,
  ) { }

  get hasPassphrase(): boolean {
    return isPasswordEncrypted(this.dataset);
  }

  get isEncryptionRoot(): boolean {
    return isEncryptionRoot(this.dataset);
  }

  get currentStateLabel(): string {
    if (!this.dataset.encrypted) {
      return this.translate.instant('Unencrypted');
    }

    if (this.dataset.locked) {
      if (!this.isEncryptionRoot) {
        return this.translate.instant('Locked by ancestor');
      }

      return this.translate.instant('Locked');
    }

    return this.translate.instant('Unlocked');
  }

  get canExportKey(): boolean {
    return !this.hasPassphrase && this.dataset.key_loaded;
  }

  get canEdit(): boolean {
    return this.dataset.encrypted && !this.dataset.locked;
  }

  get canUnlock(): boolean {
    return this.isEncryptionRoot && this.dataset.locked && !this.parentDataset?.locked;
  }

  onEditPressed(): void {
    const dialog = this.matDialog.open(EncryptionOptionsDialogComponent, {
      data: {
        dataset: this.dataset,
        parent: this.parentDataset,
      } as EncryptionOptionsDialogData,
    });
    dialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.datasetStore.datasetUpdated());
  }

  onLock(): void {
    this.matDialog.open(LockDatasetDialogComponent, {
      data: this.dataset,
    })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.datasetStore.datasetUpdated());
  }

  onExportKey(): void {
    this.matDialog.open(ExportDatasetKeyDialogComponent, {
      data: this.dataset,
    });
  }

  onExportAllKeys(): void {
    this.matDialog.open(ExportAllKeysDialogComponent, {
      data: this.dataset,
    });
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  protected readonly Role = Role;
}
