import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, Observable, of, pairwise, startWith,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { BulkListItem, BulkListItemState } from 'app/core/components/bulk-list-item/bulk-list-item.interface';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Option } from 'app/interfaces/option.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  templateUrl: './app-bulk-upgrade.component.html',
  styleUrls: ['./app-bulk-upgrade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBulkUpgradeComponent {
  @ViewChild(MatAccordion) accordion: MatAccordion;

  form = this.formBuilder.group<{ [key: string]: string }>({});
  bulkItems = new Map<string, BulkListItem<ChartRelease>>();
  loadingMap = new Map<string, boolean>();
  optionsMap = new Map<string, Observable<Option[]>>();
  upgradeSummaryMap = new Map<string, UpgradeSummary>();

  readonly trackByKey: TrackByFunction<KeyValue<string, BulkListItem<ChartRelease>>> = (_, entry) => entry.key;
  readonly imagePlaceholder = appImagePlaceholder;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<AppBulkUpgradeComponent>,
    private appService: ApplicationsService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) private apps: ChartRelease[],
  ) {
    this.apps = this.apps.filter((app) => app.update_available || app.container_images_update_available);

    this.setInitialValues();
    this.detectFormChanges();
  }

  hasUpdatesForImages(name: string): boolean {
    const summary = this.upgradeSummaryMap.get(name);
    if (!summary) {
      return false;
    }
    return summary.image_update_available && Object.keys(summary.container_images_to_update).length > 0;
  }

  hasErrors(name: string): boolean {
    const item = this.bulkItems.get(name);
    if (!item) {
      return false;
    }
    return item.state === BulkListItemState.Error && Boolean(item.message);
  }

  onExpand(row: KeyValue<string, BulkListItem<ChartRelease>>): void {
    if (this.upgradeSummaryMap.has(row.key)) {
      return;
    }

    this.getUpgradeSummary(row.value.item.name);
  }

  getUpgradeSummary(name: string, version?: string): void {
    this.loadingMap.set(name, true);
    this.appService
      .getChartUpgradeSummary(name, version)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (summary) => {
          const availableOptions = summary.available_versions_for_upgrade.map((item) => {
            return { value: item.version, label: item.version } as Option;
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

  originalOrder(): number {
    return 0;
  }

  onSubmit(): void {
    const payload: ChartReleaseUpgradeParams[] = Object.entries(this.form.value).map(([name, version]) => {
      this.bulkItems.set(name, { ...this.bulkItems.get(name), state: BulkListItemState.Running });
      return [name, { item_version: version }];
    });

    this.ws
      .job('core.bulk', ['chart.release.upgrade', payload])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.dialogRef.close();
        this.snackbar.success(
          this.translate.instant('Upgrading Apps. Please check on the progress in Task Manager.'),
        );
        this.store$.dispatch(jobIndicatorPressed());
      });
  }

  private setInitialValues(): void {
    this.apps.forEach((app) => {
      this.bulkItems.set(app.name, { state: BulkListItemState.Initial, item: app });
      const [, latestVersion] = app.human_latest_version.split('_');
      this.form.addControl(app.name, this.formBuilder.control<string>(latestVersion));
    });
  }

  private detectFormChanges(): void {
    this.form.valueChanges
      .pipe(
        startWith(this.form.value),
        pairwise(),
        map(([oldValues, newValues]) => {
          return Object.entries(newValues).find(([app, version]) => oldValues[app] !== version);
        }),
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(([app, version]) => {
        this.getUpgradeSummary(app, version);
      });
  }
}
