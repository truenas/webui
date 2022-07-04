import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { DatasetStore } from 'app/pages/datasets/store/dataset-store.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-dataset-node',
  templateUrl: './dataset-node.component.html',
  styleUrls: ['./dataset-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetNodeComponent implements OnInit {
  @Input() dataset: Dataset;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private datasetStore: DatasetStore,
  ) { }

  ngOnInit(): void {
    this.datasetStore.onReloadList
      .pipe(untilDestroyed(this))
      .subscribe(() => this.reloadDataset());
  }

  reloadDataset(): void {
    this.ws.call('pool.dataset.query', [[['id', '=', this.dataset.id]]])
      .pipe(untilDestroyed(this))
      .subscribe((datasets) => {
        this.dataset = datasets[0];
        this.cdr.markForCheck();
      });
  }

  get nameSegments(): string[] {
    return this.dataset.name.split('/');
  }

  get label(): string {
    return this.nameSegments[this.nameSegments.length - 1];
  }

  get level(): number {
    return this.nameSegments.length;
  }

  get isRoot(): boolean {
    return this.level === 1;
  }

  get roles(): string[] {
    if (this.isRoot) {
      return ['Root Dataset'];
    }
    return [];
  }
}
