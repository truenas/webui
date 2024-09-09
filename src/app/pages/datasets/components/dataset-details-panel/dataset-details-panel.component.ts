import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, take } from 'rxjs';
import { DatasetType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { datasetDetailsPanelElements } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.elements';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { doesDatasetHaveShares, isIocageMounted } from 'app/pages/datasets/utils/dataset.utils';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private slideInService: IxSlideInService,
  ) { }

  protected readonly hasRoles = computed(() => {
    return this.dataset().type === DatasetType.Filesystem && !isIocageMounted(this.dataset());
  });

  protected readonly hasPermissions = computed(() => {
    return this.hasRoles() && !this.dataset().locked;
  });

  protected readonly hasChildrenWithShares = computed(() => doesDatasetHaveShares(this.dataset()));

  protected readonly isCapacityAllowed = computed(() => !this.dataset().locked);
  protected readonly isEncryptionAllowed = computed(() => this.dataset().encrypted);
  protected readonly ownName = computed(() => this.dataset().name.split('/').slice(-1)[0]);

  protected readonly isZvol = computed(() => this.dataset().type === DatasetType.Volume);

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown>, modalType: unknown): void {
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
