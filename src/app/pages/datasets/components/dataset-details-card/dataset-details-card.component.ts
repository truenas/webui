import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { WebSocketService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-details-card',
  templateUrl: './dataset-details-card.component.html',
  styleUrls: ['./dataset-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetDetailsCardComponent implements OnChanges {
  @Input() dataset: Dataset;
  loading = false;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.ws.call('pool.dataset.query', [[['id', '=', changes.dataset.currentValue.id]]]).pipe(untilDestroyed(this)).subscribe(
      (datasets) => {
        this.loading = false;
        this.dataset = datasets[0];
        this.cdr.markForCheck();
      },
    );
  }

  editDataset(): void {
    const editDatasetComponent = this.modalService.openInSlideIn(DatasetFormComponent, this.dataset.id);
    editDatasetComponent.setPk(this.dataset.id);
    editDatasetComponent.setVolId(this.dataset.pool);
    editDatasetComponent.setTitle(this.translate.instant('Edit Dataset'));
  }
}
