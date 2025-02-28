import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, first, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetType } from 'app/enums/dataset.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  ],
})
export class DatasetDetailsCardComponent {
  readonly dataset = input.required<DatasetDetails>();

  protected readonly Role = Role;
  readonly OnOff = OnOff;

  constructor(
    private translate: TranslateService,
    private matDialog: MatDialog,
    private datasetStore: DatasetTreeStore,
    private slideIn: SlideIn,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private api: ApiService,
    private snackbar: SnackbarService,
  ) { }

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

  protected readonly hasComments = computed(() => {
    return this.dataset().comments?.source === ZfsPropertySource.Local && !!this.dataset().comments?.value?.length;
  });

  protected readonly canBePromoted = computed(() => Boolean(this.dataset().origin?.parsed));

  deleteDataset(): void {
    this.matDialog.open(DeleteDatasetDialogComponent, { data: this.dataset() })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.datasetStore.datasetUpdated();
          return this.datasetStore.selectedParentDataset$.pipe(first());
        }),
        untilDestroyed(this),
      )
      .subscribe((parent) => {
        this.router.navigate(['/datasets', parent?.id], { state: { hideMobileDetails: true } });
      });
  }

  promoteDataset(): void {
    this.api.call('pool.dataset.promote', [this.dataset().id])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dataset promoted successfully.'));
        this.datasetStore.datasetUpdated();
      });
  }

  editDataset(): void {
    this.slideIn.open(DatasetFormComponent, {
      wide: true, data: { datasetId: this.dataset().id, isNew: false },
    }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.datasetStore.datasetUpdated());
  }

  editZvol(): void {
    this.slideIn.open(ZvolFormComponent, {
      data: { isNew: false, parentId: this.dataset().id },
    }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.datasetStore.datasetUpdated());
  }
}
