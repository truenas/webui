import { KeyValue } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, TrackByFunction,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  of, Observable,
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { latestVersion } from 'app/constants/catalog.constants';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import {
  ContainerImage, PullContainerImageParams, PullContainerImageResponse,
} from 'app/interfaces/container-image.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './docker-image-update-dialog.component.html',
  styleUrls: ['./docker-image-update-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerImageUpdateDialogComponent {
  form = this.fb.group({});
  isJobCompleted = false;
  wasSubmitted = false;
  readonly tooltips = {
    tag: helptext.dockerImages.chooseTag.selectTag.placeholder,
  };
  options = new Map<string, Observable<Option[]>>();
  bulkItems = new Map<string, BulkListItem<ContainerImage>>();
  readonly trackByKey: TrackByFunction<KeyValue<string, BulkListItem<ContainerImage>>> = (_, entry) => entry.key;
  readonly JobState = JobState;

  get successCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Success).length;
  }
  get failedCount(): number {
    return [...this.bulkItems.values()].filter((item) => item.state === BulkListItemState.Error).length;
  }

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<DockerImageUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private images: ContainerImage[],
  ) {
    this.images = this.images.filter((image) => image.update_available && image.repo_tags?.length);
    this.images.forEach((image) => {
      const options: Option[] = image.repo_tags.map((tag) => ({
        label: tag,
        value: tag,
      }));

      this.options.set(image.id, of(options));
      this.form.addControl(image.id, this.fb.control(options[0].value));
      this.bulkItems.set(image.id, {
        item: image,
        state: BulkListItemState.Initial,
        message: this.translate.instant('Update available'),
      });
    });
  }

  onSubmit(): void {
    this.wasSubmitted = true;

    const payload = Object.entries(this.form.value).map(([key, value]: [key: string, value: string]) => {
      this.bulkItems.set(key, { ...this.bulkItems.get(key), state: BulkListItemState.Running });
      const params = value.split(':');
      return [{
        from_image: params[0],
        tag: params.length > 1 ? params[1] : latestVersion,
      }];
    });

    this.ws.job('core.bulk', ['container.image.pull', payload]).pipe(
      filter((job: Job<CoreBulkResponse<PullContainerImageResponse[]>[], PullContainerImageParams[]>) => !!job.result),
      untilDestroyed(this),
    ).subscribe((response) => {
      response.result.forEach((item, index) => {
        const image = this.images[index];
        if (item.error) {
          this.bulkItems.set(image.id, {
            ...this.bulkItems.get(image.id),
            state: BulkListItemState.Error,
            message: item.error,
          });
        } else {
          this.bulkItems.set(image.id, {
            ...this.bulkItems.get(image.id),
            state: BulkListItemState.Success,
            message: item.result[item.result.length - 1].status.replace('Status:', ''),
          });
          if (this.bulkItems.size === 1) {
            this.dialogRef.close();
          }
        }
      });
      this.isJobCompleted = true;
      this.cdr.markForCheck();
    });
  }
}
