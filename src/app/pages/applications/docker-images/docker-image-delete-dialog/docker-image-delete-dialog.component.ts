import { KeyValue } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, TrackByFunction,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { ContainerImage, DeleteContainerImageParams } from 'app/interfaces/container-image.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './docker-image-delete-dialog.component.html',
  styleUrls: ['./docker-image-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerImageDeleteDialogComponent {
  form = this.fb.group({
    force: [false],
    confirm: [false, [Validators.requiredTrue]],
  });
  isJobCompleted = false;
  bulkItems = new Map<string, BulkListItem<ContainerImage>>();
  hasErrors = false;

  get successCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Success).length;
  }
  get failedCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Error).length;
  }
  readonly trackById: TrackByFunction<KeyValue<string, BulkListItem<ContainerImage>>> = (_, entry) => entry.key;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DockerImageDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public images: ContainerImage[],
  ) {
    this.images.forEach((image) => {
      this.bulkItems.set(image.id, { state: BulkListItemState.Initial, item: image });
    });
  }

  onSubmit(): void {
    const { force } = this.form.value;

    const params = this.images.map((image) => [image.id, { force }]);

    this.images.forEach((image) => {
      this.bulkItems.set(image.id, { state: BulkListItemState.Running, item: image });
    });

    this.ws.job('core.bulk', ['container.image.delete', params]).pipe(
      filter((job: Job<CoreBulkResponse<void>[], DeleteContainerImageParams[]>) => !!job.result),
      untilDestroyed(this),
    ).subscribe((response) => {
      response.arguments[1].forEach((params, index: number) => {
        const [imageId] = params.toString().split(',');
        const bulkItem = this.bulkItems.get(imageId);
        if (bulkItem) {
          const item = response.result[index];
          if (item.error) {
            this.bulkItems.set(imageId, {
              ...bulkItem,
              state: BulkListItemState.Error,
              message: item.error
                .replace('[EFAULT]', '')
                .replace('DockerError(409, \'', '')
                .replace('\')', ''),
            });
          } else {
            this.bulkItems.set(imageId, {
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
