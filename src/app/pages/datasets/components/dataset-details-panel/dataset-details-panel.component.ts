import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { ModalService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-panel',
  templateUrl: './dataset-details-panel.component.html',
  styleUrls: ['./dataset-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsPanelComponent implements OnInit {
  @Input() dataset: Dataset;
  @Input() parentDataset: Dataset | undefined;

  constructor(
    private modalService: ModalService,
    private translate: TranslateService,
    private datasetStore: DatasetStore,
  ) {}

  ngOnInit(): void {
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.datasetStore.reloadList();
    });
  }

  get parentPath(): string {
    const parentPath = this.dataset.name.split('/').slice(0, -1).join('/');
    return `/${parentPath}/`;
  }

  get ownName(): string {
    return this.dataset.name.split('/').slice(-1)[0];
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  onAddDataset(): void {
    const addDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent);
    addDatasetComponent.setParent(this.dataset.id);
    addDatasetComponent.setVolId(this.dataset.pool);
    addDatasetComponent.setTitle(this.translate.instant('Add Dataset'));
  }

  onAddZvol(): void {
    const addZvolComponent = this.modalService.openInSlideIn(ZvolFormComponent);
    addZvolComponent.setParent(this.dataset.id);
    addZvolComponent.isNew = true;
  }
}
