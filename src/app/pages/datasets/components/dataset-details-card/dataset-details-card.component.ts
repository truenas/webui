import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnTooltipDirective, TnDialog, TnCardComponent, TnButtonComponent, TnCardFooterActionsDirective,
  TnTestIdDirective, type TnCardAction, type TnMenuItem,
} from '@truenas/ui-components';
import { filter, first, switchMap } from 'rxjs/operators';
import { DatasetType, DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { datasetDetailsHelptext } from 'app/helptext/storage/volumes/datasets/dataset-details';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    TnCardComponent,
    TnButtonComponent,
    TnCardFooterActionsDirective,
    TranslateModule,
    TnTestIdDirective,
    OrNotAvailablePipe,
    TnTooltipDirective,
    CopyButtonComponent,
    TooltipComponent,
    TierStatusComponent,
  ],
})
export class DatasetDetailsCardComponent {
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private datasetStore = inject(DatasetTreeStore);
  private formPanel = inject(FormSidePanelService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private tierService = inject(SharingTierService);
  private authService = inject(AuthService);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly Role = Role;
  readonly OnOff = OnOff;
  readonly DatasetCaseSensitivity = DatasetCaseSensitivity;

  private hasDatasetWrite = toSignal(this.authService.hasRole(Role.DatasetWrite), { initialValue: false });
  private hasDatasetDelete = toSignal(this.authService.hasRole(Role.DatasetDelete), { initialValue: false });

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

  protected readonly editAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasDatasetWrite()) {
      return undefined;
    }
    return this.isFilesystem()
      ? { label: this.translate.instant('Edit'), testId: 'edit-dataset', handler: () => this.editDataset() }
      : { label: this.translate.instant('Edit Zvol'), testId: 'edit-zvol', handler: () => this.editZvol() };
  });

  protected readonly deleteAction = computed<TnCardAction | undefined>(() => {
    if (this.dataset().id === this.dataset().pool || !this.hasDatasetDelete()) {
      return undefined;
    }
    return { label: this.translate.instant('Delete'), testId: 'delete-dataset', handler: () => this.deleteDataset() };
  });

  protected readonly actionsMenu = computed<TnMenuItem[] | undefined>(() => {
    if (this.dataset().id === this.dataset().pool || !this.canBePromoted() || !this.hasDatasetWrite()) {
      return undefined;
    }
    return [{
      id: 'promote',
      label: this.translate.instant('Promote'),
      testId: 'promote-dataset',
      action: () => this.promoteDataset(),
    }];
  });

  protected readonly isRootDataset = computed(() => !!this.dataset() && isRootDataset(this.dataset()));

  private deleteDataset(): void {
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

  private promoteDataset(): void {
    this.api.call('pool.dataset.promote', [this.dataset().id])
      .pipe(this.errorHandler.withErrorHandler(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dataset promoted successfully.'));
        this.datasetStore.datasetUpdated();
      });
  }

  protected changeTier(): void {
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

  private editDataset(): void {
    this.formPanel.open<Dataset>(DatasetFormComponent, {
      wide: true,
      title: this.translate.instant('Edit Dataset'),
      inputs: { params: { datasetId: this.dataset().id, isNew: false } },
    }).onSuccess(() => this.datasetStore.datasetUpdated(), this.destroyRef);
  }

  private editZvol(): void {
    this.formPanel.open<Dataset>(ZvolFormComponent, {
      title: this.translate.instant('Edit Zvol'),
      inputs: { params: { isNew: false, parentOrZvolId: this.dataset().id } },
    }).onSuccess((response) => {
      this.snackbar.success(
        this.translate.instant('Zvol «{name}» updated.', { name: getDatasetLabel(response) }),
      );
      this.datasetStore.datasetUpdated();
    }, this.destroyRef);
  }
}
