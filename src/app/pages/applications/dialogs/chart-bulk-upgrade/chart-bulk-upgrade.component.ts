import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, TrackByFunction, ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, Observable, of, pairwise, startWith, tap,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { JobState } from 'app/enums/job-state.enum';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { WebSocketService } from 'app/services';

type BulkUpgradeArguments = ['chart.release.upgrade', ChartReleaseUpgradeParams];

@UntilDestroy()
@Component({
  templateUrl: './chart-bulk-upgrade.component.html',
  styleUrls: ['./chart-bulk-upgrade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBulkUpgradeComponent {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  form = this.fb.group<{ [key: string]: string }>({});
  isJobCompleted = false;
  wasSubmitted = false;
  selectedJob: Job<CoreBulkResponse<ChartRelease>[], BulkUpgradeArguments>;
  bulkItems = new Map<string, BulkListItem<ChartRelease>>();
  upgradeSummaryMap = new Map<string, UpgradeSummary>();
  optionsMap = new Map<string, Observable<Option[]>>();
  loadingMap = new Map<string, boolean>();

  readonly trackById: TrackByFunction<KeyValue<string, BulkListItem<ChartRelease>>> = (_, entry) => entry.key;
  readonly JobState = JobState;
  readonly imagePlaceholder = appImagePlaceholder;

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
      this.form.addControl(app.name, this.fb.control<string>(app.human_latest_version));
      this.loadingMap.set(app.name, false);
    });

    this.detectFormChanges();
  }

  onSubmit(): void {
    this.wasSubmitted = true;
    // this.accordion.closeAll();

    const payload: ChartReleaseUpgradeParams[] = [];
    Object.entries(this.form.value).forEach(([name, version]) => {
      this.bulkItems.set(name, { ...this.bulkItems.get(name), state: BulkListItemState.Running });
      this.form.get(name).disable();
      payload.push([name, { item_version: version }]);
    });

    this.ws.job('core.bulk', ['chart.release.upgrade', payload]).pipe(
      tap((job: Job<CoreBulkResponse<ChartRelease>[], BulkUpgradeArguments>) => {
        this.selectedJob = job;
        if (job?.progress?.percent) {
          const name = job.arguments[1][0][0];
          if (this.bulkItems.has(name)) {
            this.bulkItems.set(name, {
              ...this.bulkItems.get(name),
              state: BulkListItemState.Running,
              message: job.progress.description,
            });
          }
        }
      }),
      filter((job: Job<CoreBulkResponse<ChartRelease>[], BulkUpgradeArguments>) => !!job.result),
      untilDestroyed(this),
    ).subscribe((response) => {
      response.result.forEach((item, index) => {
        let app = this.apps[index];
        if (item.error) {
          this.bulkItems.set(app.name, {
            ...this.bulkItems.get(app.name),
            state: BulkListItemState.Error,
            message: item.error.replace('[EFAULT]', ''),
          });
        } else {
          const appFromResults = this.apps.find((iteration) => iteration.name === item.result?.name);
          if (appFromResults) {
            app = appFromResults;
          }
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

  hasUpdatesForImages(name: string): boolean {
    const summary = this.upgradeSummaryMap.get(name);
    if (!summary) {
      return false;
    }
    return summary.image_update_available && Object.keys(summary.container_images_to_update).length > 0;
  }

  onExpand(row: KeyValue<string, BulkListItem<ChartRelease>>): void {
    if (this.upgradeSummaryMap.has(row.key) || this.wasSubmitted) {
      return;
    }

    this.getUpgradeSummary(row.value.item.name);
  }

  getUpgradeSummary(name: string, version?: string): void {
    this.loadingMap.set(name, true);
    this.appService.getUpgradeSummary(name, version).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (summary) => {
        const availableOptions = summary.available_versions_for_upgrade.map((item) => {
          return { value: item.version, label: item.human_version } as Option;
        });
        this.upgradeSummaryMap.set(name, summary);
        this.optionsMap.set(name, of(availableOptions));
        this.form.patchValue({
          [name]: version || String(availableOptions[0].value),
        });
        this.loadingMap.set(name, false);
      },
      error: (error) => {
        console.error(error);
        this.loadingMap.set(name, false);
      },
    });
  }

  detectFormChanges(): void {
    this.form.valueChanges.pipe(
      startWith(this.form.value),
      pairwise(),
      map(([oldValues, newValues]) => {
        return Object.entries(newValues).find(([app, version]) => oldValues[app] !== version);
      }),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(([app, version]) => {
      this.getUpgradeSummary(app, version);
    });
  }

  originalOrder(): number {
    return 0;
  }
}
