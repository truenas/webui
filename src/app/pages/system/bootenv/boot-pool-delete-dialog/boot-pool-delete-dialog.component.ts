import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, TrackByFunction,
} from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-delete-dialog.component.html',
  styleUrls: ['./boot-pool-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolDeleteDialogComponent {
  form = this.fb.group({
    confirm: [false, [Validators.requiredTrue]],
  });
  isJobCompleted = false;
  bulkItems = new Map<string, BulkListItem<Bootenv>>();
  hasErrors = false;

  get successCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Success).length;
  }
  get failedCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Error).length;
  }
  readonly trackByKey: TrackByFunction<KeyValue<string, BulkListItem<Bootenv>>> = (_, entry) => entry.key;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<BootPoolDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public bootenvs: Bootenv[],
  ) {
    this.bootenvs.forEach((bootenv) => {
      this.bulkItems.set(bootenv.id, { state: BulkListItemState.Initial, item: bootenv });
    });
  }

  getSelectedNames(selectedBootenvs: Bootenv[]): string[][] {
    return selectedBootenvs.map((bootenv) => [bootenv.id]);
  }

  onSubmit(): void {
    const bootenvsToDelete = this.getSelectedNames(this.bootenvs);

    this.bootenvs.forEach((bootenv) => {
      this.bulkItems.set(bootenv.id, { state: BulkListItemState.Running, item: bootenv });
    });

    this.ws.job('core.bulk', ['bootenv.do_delete', bootenvsToDelete]).pipe(
      filter((job: Job<CoreBulkResponse<void>[], string[][]>) => !!job.result),
      untilDestroyed(this),
    ).subscribe((response) => {
      response.arguments[1].forEach((params, index: number) => {
        const [bootenvId] = params.toString().split(',');
        const bulkItem = this.bulkItems.get(bootenvId);
        if (bulkItem) {
          const item = response.result[index];
          if (item.error) {
            this.bulkItems.set(bootenvId, {
              ...bulkItem,
              state: BulkListItemState.Error,
              message: item.error
                .replace('[EFAULT]', '')
                .replace('\')', ''),
            });
          } else {
            this.bulkItems.set(bootenvId, {
              ...bulkItem,
              state: BulkListItemState.Success,
              message: null,
            });
            if (this.bulkItems.size === 1) {
              this.dialogRef.close(true);
            }
          }
        }
      });
      this.isJobCompleted = true;
      this.cdr.markForCheck();
    });
  }
}
