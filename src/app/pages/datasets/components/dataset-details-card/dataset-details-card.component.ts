import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import { filter, first, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetType, DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { datasetDetailsHelptext } from 'app/helptext/storage/volumes/datasets/dataset-details';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialog } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { getDatasetLabel, getUserProperty, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { TierStatusComponent } from 'app/pages/sharing/components/tier-status/tier-status.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    MatCardContent,
    OrNotAvailablePipe,
    MatTooltip,
    CopyButtonComponent,
    MatCardActions,
    TooltipComponent,
    TierStatusComponent,
  ],
})
export class DatasetDetailsCardComponent {
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private datasetStore = inject(DatasetTreeStore);
  private slideIn = inject(SlideIn);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private tierService = inject(SharingTierService);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly Role = Role;
  readonly OnOff = OnOff;
  readonly DatasetCaseSensitivity = DatasetCaseSensitivity;

  protected readonly datasetCompression = computed(() => {
    const compressRatioValue = this.dataset().compressratio?.value;
    const compressionValue = this.dataset().compression?.value;
    const compression = compressRatioValue ? `${compressRatioValue} (${compressionValue})` : compressionValue;

    return this.dataset()?.compression?.source === ZfsPropertySource.Inherited
      ? this.translate.instant('Inherit ({value})', { value: compression })
      : compression;
  });

  protected readonly isFilesystem = computed(() => this.dataset().type === DatasetType.Filesystem);
  protected readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);
  protected readonly helptext = datasetDetailsHelptext;

  protected readonly hasComments = computed(() => {
    const comments = getUserProperty<string>(this.dataset(), 'comments');
    return comments?.source === ZfsPropertySource.Local && !!comments?.value?.length;
  });

  protected readonly commentsValue = computed(() => {
    const comments = getUserProperty<string>(this.dataset(), 'comments');
    return comments?.value || '';
  });

  protected readonly canBePromoted = computed(() => Boolean(this.dataset().origin?.parsed));

  get isRootDataset(): boolean {
    return !!this.dataset() && isRootDataset(this.dataset());
  }

  deleteDataset(): void {
    this.tnDialog.open(DeleteDatasetDialog, { data: this.dataset() })
      .closed
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.datasetStore.datasetUpdated();
          return this.datasetStore.selectedParentDataset$.pipe(first());
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((parent) => {
        this.router.navigate(['/datasets', parent?.id]);
      });
  }

  promoteDataset(): void {
    this.api.call('pool.dataset.promote', [this.dataset().id])
      .pipe(this.errorHandler.withErrorHandler(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dataset promoted successfully.'));
        this.datasetStore.datasetUpdated();
      });
  }

  changeTier(): void {
    const currentTier = this.dataset().tier?.tier_type;
    if (!currentTier) {
      this.errorHandler.showErrorModal(
        new Error(this.translate.instant('Current storage tier is unknown for this dataset.')),
      );
      return;
    }

    this.tierService.openChangeTierDialogForDataset({
      datasetName: this.dataset().name,
      currentTier,
      poolName: this.dataset().name.split('/')[0],
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.datasetStore.datasetUpdated());
  }

  editDataset(): void {
    this.slideIn.open(DatasetFormComponent, {
      wide: true, data: { datasetId: this.dataset().id, isNew: false },
    }).onSuccess(() => this.datasetStore.datasetUpdated(), this.destroyRef);
  }

  editZvol(): void {
    this.slideIn.open(ZvolFormComponent, {
      data: { isNew: false, parentOrZvolId: this.dataset().id },
    }).onSuccess((response) => {
      this.snackbar.success(
        this.translate.instant('Zvol «{name}» updated.', { name: getDatasetLabel(response) }),
      );
      this.datasetStore.datasetUpdated();
    }, this.destroyRef);
  }
}
