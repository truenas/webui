import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { DatasetType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DataProtectionCardComponent } from 'app/pages/datasets/components/data-protection-card/data-protection-card.component';
import { DatasetCapacityManagementCardComponent } from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { datasetDetailsPanelElements } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.elements';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { RolesCardComponent } from 'app/pages/datasets/components/roles-card/roles-card.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { ZfsEncryptionCardComponent } from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import { PermissionsCardComponent } from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { doesDatasetHaveShares, isIocageMounted } from 'app/pages/datasets/utils/dataset.utils';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
    AsyncPipe,
    MobileBackButtonComponent,
    IxIconComponent,
    TranslateModule,
    DatasetIconComponent,
    MatTooltip,
    MatButton,
    RequiresRolesDirective,
    UiSearchDirective,
    DatasetDetailsCardComponent,
    DatasetCapacityManagementCardComponent,
    ZfsEncryptionCardComponent,
    DataProtectionCardComponent,
    RolesCardComponent,
    PermissionsCardComponent,
  ],
})
export class DatasetDetailsPanelComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly systemDataset = input<string>();

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly searchableElements = datasetDetailsPanelElements;

  selectedParentDataset$ = this.datasetStore.selectedParentDataset$;

  constructor(
    private datasetStore: DatasetTreeStore,
    private router: Router,
    private slideInService: SlideInService,
  ) { }

  protected readonly hasRoles = computed(() => {
    return this.dataset().type === DatasetType.Filesystem && !isIocageMounted(this.dataset());
  });

  protected readonly hasPermissions = computed(() => {
    return this.hasRoles();
  });

  protected readonly hasChildrenWithShares = computed(() => doesDatasetHaveShares(this.dataset()));

  protected readonly isCapacityAllowed = computed(() => !this.dataset().locked);
  protected readonly isEncryptionAllowed = computed(() => this.dataset().encrypted);
  protected readonly ownName = computed(() => this.dataset().name.split('/').slice(-1)[0]);

  protected readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);

  handleSlideInClosed(slideInRef: SlideInRef<unknown>, modalType: unknown): void {
    slideInRef.slideInClosed$.pipe(untilDestroyed(this))
      .subscribe((value: { id: string }) => {
        this.datasetStore.datasetUpdated();

        if ((modalType !== DatasetFormComponent && modalType !== ZvolFormComponent) || !value?.id) {
          return;
        }

        this.datasetStore.isLoading$.pipe(filter((isLoading) => !isLoading), take(1), untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/datasets', value.id]);
          });
      });
  }

  onAddDataset(): void {
    const slideInRef = this.slideInService.open(DatasetFormComponent, {
      wide: true, data: { isNew: true, datasetId: this.dataset().id },
    });
    this.handleSlideInClosed(slideInRef, DatasetFormComponent);
  }

  onAddZvol(): void {
    const slideInRef = this.slideInService.open(ZvolFormComponent, {
      data: { isNew: true, parentId: this.dataset().id },
    });
    this.handleSlideInClosed(slideInRef, ZvolFormComponent);
  }

  onCloseMobileDetails(): void {
    this.router.navigate(['/datasets'], { state: { hideMobileDetails: true } });
  }
}
