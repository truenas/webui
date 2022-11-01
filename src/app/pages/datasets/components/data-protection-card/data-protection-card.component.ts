import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
})
export class DataProtectionCardComponent implements OnInit, OnChanges {
  readonly console = console;
  changeEvent$: Subject<string> = new Subject();
  isLoading = false;
  constructor(
    private slideIn: IxSlideInService,
    private snackbarService: SnackbarService,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {
    // Counting the number of snapshots for zvol
    // https://ixsystems.atlassian.net/browse/NAS-118753
    this.changeEvent$.pipe(
      switchMap((id) => {
        this.isLoading = true;
        return this.ws.call('zfs.snapshot.query', [[['dataset', '=', id]]]);
      }),
      untilDestroyed(this),
    ).subscribe((res) => {
      this.dataset = { ...this.dataset, snapshot_count: res.length };
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  @Input() dataset: DatasetDetails;

  ngOnChanges(): void {
    if (this.dataset.type === DatasetType.Volume) {
      this.changeEvent$.next(this.dataset.id);
    }
  }

  ngOnInit(): void {
    this.slideIn.onClose$.pipe(
      filter((value) => value.modalType === SnapshotAddFormComponent && value.response === true),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Snapshot added successfully.'));
    });
  }

  addSnapshot(): void {
    const addForm = this.slideIn.open(SnapshotAddFormComponent);
    addForm.setDataset(this.dataset.id);
  }
}
