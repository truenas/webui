import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, TrackByFunction,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, Observable, of, tap,
} from 'rxjs';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { JobState } from 'app/enums/job-state.enum';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './chart-bulk-upgrade.component.html',
  styleUrls: ['./chart-bulk-upgrade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBulkUpgradeComponent {
  form = this.fb.group({});
  isJobCompleted = false;
  wasSubmitted = false;
  readonly tooltips = {
    tag: '',
  };
  options = new Map<string, Observable<Option[]>>();
  bulkItems = new Map<string, BulkListItem<ChartRelease>>();
  readonly trackById: TrackByFunction<KeyValue<string, BulkListItem<ChartRelease>>> = (_, entry) => entry.key;
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
    private dialogRef: MatDialogRef<ChartBulkUpgradeComponent>,
    private appService: ApplicationsService,
    @Inject(MAT_DIALOG_DATA) private apps: ChartRelease[],
  ) {
    this.apps = this.apps.filter((app) => app.update_available || app.container_images_update_available);
    this.apps.forEach((app) => {
      this.bulkItems.set(app.name, { state: BulkListItemState.Initial, item: app });
      this.form.addControl(app.name, this.fb.control(app.human_latest_version));
      const options: Option[] = [{ label: app.human_latest_version, value: app.human_latest_version }];
      this.options.set(app.name, of(options));
    });
  }

  onSubmit(): void {
    this.wasSubmitted = true;

    const payload = Object.entries(this.form.value).map(([key, value]) => {
      this.bulkItems.set(key, { ...this.bulkItems.get(key), state: BulkListItemState.Running });
      return [key, { item_version: value }];
    });

    this.ws.job('core.bulk', ['chart.release.upgrade', payload]).pipe(
      tap((job: Job<CoreBulkResponse<ChartRelease>[], ['chart.release.upgrade', ChartReleaseUpgradeParams]>) => {
        if (job?.progress?.percent) {
          const key = job.arguments[1][0][0];
          if (this.bulkItems.has(key)) {
            this.bulkItems.set(key, {
              ...this.bulkItems.get(key),
              state: BulkListItemState.Running,
              message: job.progress.description,
            });
          }
        }
      }),
      filter((job: Job<CoreBulkResponse<ChartRelease>[], ['chart.release.upgrade', ChartReleaseUpgradeParams]>) => !!job.result),
      untilDestroyed(this),
    ).subscribe((response) => {
      response.result.forEach((item, index) => {
        const app = this.apps[index];
        if (item.error) {
          this.bulkItems.set(app.name, {
            ...this.bulkItems.get(app.name),
            state: BulkListItemState.Error,
            message: item.error.replace('[EFAULT]', ''),
          });
        } else {
          this.bulkItems.set(app.name, {
            ...this.bulkItems.get(app.name),
            state: BulkListItemState.Success,
            message: item.result.status?.replace('Status:', ''),
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

  originalOrder(): number {
    return 0;
  }
}
