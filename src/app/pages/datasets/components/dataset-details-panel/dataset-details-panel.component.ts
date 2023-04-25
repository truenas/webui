import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DatasetType } from 'app/enums/dataset.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import {
  isDatasetHasShares, isIocageMounted, isRootDataset, ixApplications,
} from 'app/pages/datasets/utils/dataset.utils';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsPanelComponent implements OnInit {
  @Input() dataset: DatasetDetails;
  @Input() systemDataset: string;
  selectedParentDataset$ = this.datasetStore.selectedParentDataset$;

  constructor(
    private datasetStore: DatasetTreeStore,
    private router: Router,
    private slideIn: IxSlideInService,
  ) { }

  ngOnInit(): void {
    this.slideIn.onClose$
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        const dataset = value.response as Dataset;

        if ((value.modalType !== DatasetFormComponent && value.modalType !== ZvolFormComponent) || !dataset?.id) {
          return;
        }

        this.datasetStore.datasetUpdated();
        this.router.navigate(['/datasets', dataset.id]);
      });
  }

  get datasetHasRoles(): boolean {
    return !!this.dataset.apps?.length
    || this.datasetHasChildrenWithShares
    || !!this.dataset.vms?.length
    || !!this.dataset.smb_shares?.length
    || !!this.dataset.nfs_shares?.length
    || !!this.dataset.iscsi_shares?.length
    || this.isSystemDataset
    || this.dataset.name.endsWith(ixApplications);
  }

  get datasetHasChildrenWithShares(): boolean {
    return isDatasetHasShares(this.dataset);
  }

  get hasPermissions(): boolean {
    return this.dataset.type === DatasetType.Filesystem && !isIocageMounted(this.dataset);
  }

  get isCapacityAllowed(): boolean {
    return !this.dataset.locked;
  }

  get isEncryptionAllowed(): boolean {
    return this.dataset.encrypted;
  }

  get ownName(): string {
    return this.dataset.name.split('/').slice(-1)[0];
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  get isSystemDataset(): boolean {
    return this.dataset.name === this.systemDataset;
  }

  onAddDataset(): void {
    const addDataset = this.slideIn.open(DatasetFormComponent, { wide: true });
    addDataset.setForNew(this.dataset.id);
  }

  onAddZvol(): void {
    const addZvolComponent = this.slideIn.open(ZvolFormComponent);
    addZvolComponent.zvolFormInit(true, this.dataset.id);
  }

  onCloseMobileDetails(): void {
    this.router.navigate(['/datasets'], { state: { hideMobileDetails: true } });
  }
}
