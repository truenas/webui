import { KeyValue, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, signal, TrackByFunction, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import {
  MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, Observable, of, pairwise, startWith,
} from 'rxjs';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { App, AppUpgradeParams } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { BulkListItemComponent } from 'app/modules/lists/bulk-list-item/bulk-list-item.component';
import { BulkListItem, BulkListItemState } from 'app/modules/lists/bulk-list-item/bulk-list-item.interface';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { extractAppVersion } from 'app/pages/apps/utils/version-formatting.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-bulk-update',
  templateUrl: './app-bulk-update.component.html',
  styleUrls: ['./app-bulk-update.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatDialogTitle,
    MatAccordion,
    MatDialogClose,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    FakeProgressBarComponent,
    MatExpansionPanelTitle,
    BulkListItemComponent,
    IxIconComponent,
    ImgFallbackModule,
    KeyValuePipe,
    IxSelectComponent,
    RequiresRolesDirective,
    TestDirective,
    MatButton,
    NgxSkeletonLoaderModule,
  ],
})
export class AppBulkUpdateComponent {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialogRef = inject<MatDialogRef<AppBulkUpdateComponent>>(MatDialogRef);
  private appService = inject(ApplicationsService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private apps = inject<App[]>(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  readonly expandedItems = signal<string[]>([]);
  readonly loadingMap = signal<Map<string, boolean>>(new Map());

  form = this.formBuilder.group<Record<string, string>>({});
  bulkItems = new Map<string, BulkListItem<App>>();
  optionsMap = new Map<string, Observable<Option[]>>();
  upgradeSummaryMap = new Map<string, AppUpgradeSummary>();

  readonly trackByKey: TrackByFunction<KeyValue<string, BulkListItem<App>>> = (_, entry) => entry.key;
  readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  constructor() {
    this.apps = this.apps.filter((app) => app.upgrade_available);

    this.setInitialValues();
    this.detectFormChanges();
  }

  hasErrors(name: string): boolean {
    const item = this.bulkItems.get(name);
    if (!item) {
      return false;
    }
    return item.state === BulkListItemState.Error && Boolean(item.message);
  }

  onExpand(row: KeyValue<string, BulkListItem<App>>): void {
    this.expandedItems.set([...this.expandedItems(), row.key]);
    if (this.upgradeSummaryMap.has(row.key)) {
      return;
    }

    this.getUpgradeSummary(row.value.item);
  }

  isItemExpanded(row: KeyValue<string, BulkListItem<App>>): boolean {
    return this.expandedItems().includes(row.key);
  }

  hasMultipleVersionOptions(appName: string): boolean {
    const summary = this.upgradeSummaryMap.get(appName);
    return (summary?.available_versions_for_upgrade?.length || 0) > 1;
  }

  getVersionInfo(app: App, appName: string): {
    currentAppVersion: string;
    currentCatalogVersion: string;
    latestAppVersion: string;
    latestCatalogVersion: string;
    hasAppVersionChange: boolean;
  } {
    const currentAppVersion = extractAppVersion(app.human_version, app.version);
    const currentCatalogVersion = app.version;

    const summary = this.upgradeSummaryMap.get(appName);
    // Use the latest_app_version field from the API if available, otherwise extract from latest_human_version
    const latestAppVersion = summary?.latest_app_version
      || extractAppVersion(summary?.latest_human_version, summary?.latest_version || app.latest_version);
    const latestCatalogVersion = this.form.value[appName] || app.latest_version;

    return {
      currentAppVersion,
      currentCatalogVersion,
      latestAppVersion,
      latestCatalogVersion,
      hasAppVersionChange: currentAppVersion !== latestAppVersion,
    };
  }

  private getUpgradeSummary(app: App, version?: string): void {
    const name = app.name;
    this.loadingMap.update((currentMap) => new Map(currentMap).set(name, true));

    this.appService
      .getAppUpgradeSummary(name, version)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (summary) => {
          // Check if app version is changing
          const currentAppVersion = extractAppVersion(app.human_version, app.version);
          const latestAppVersion = summary.latest_app_version
            || extractAppVersion(summary.latest_human_version, summary.latest_version);
          const isAppVersionChanging = currentAppVersion !== latestAppVersion;

          // Check if all app versions are unique (no duplicates)
          const appVersions = summary.available_versions_for_upgrade?.map((item) => {
            // Use app_version from API if available, otherwise extract from human_version
            return item.app_version || extractAppVersion(item.human_version, item.version);
          }) || [];
          const hasUniqueAppVersions = new Set(appVersions).size === appVersions.length;

          const availableOptions = summary.available_versions_for_upgrade?.map((item) => {
            // Only hide revision if:
            // 1. App version is changing (users care about app version)
            // 2. All app versions are unique (no duplicates that need revision for disambiguation)
            const shouldHideRevision = isAppVersionChanging && hasUniqueAppVersions;

            // Use app_version from API if available for accurate display
            const appVersionToShow = item.app_version || extractAppVersion(item.human_version, item.version);

            // Format label: show app version, optionally with revision
            const label = shouldHideRevision
              ? appVersionToShow
              : `${appVersionToShow} (${item.version})`;

            return { value: item.version, label } as Option;
          }) || [];
          this.upgradeSummaryMap.set(name, summary);
          this.optionsMap.set(name, of(availableOptions));
          this.form.patchValue({
            [name]: version || String(availableOptions[0].value),
          });
          this.loadingMap.update((currentMap) => new Map(currentMap).set(name, false));
        },
        error: (error: unknown) => {
          this.loadingMap.update((currentMap) => new Map(currentMap).set(name, false));
          const item = this.bulkItems.get(name);
          if (item) {
            item.state = BulkListItemState.Error;
            item.message = error instanceof Error ? error.message : 'Failed to load upgrade information';
          }
        },
      });
  }

  originalOrder(): number {
    return 0;
  }

  onSubmit(): void {
    const payload: AppUpgradeParams[] = Object.entries(this.form.value).map(([name, version]) => {
      this.bulkItems.set(name, { ...this.bulkItems.get(name), state: BulkListItemState.Running });
      const params: AppUpgradeParams = [name];
      if (this.expandedItems().includes(name)) {
        params.push({ app_version: version || undefined });
      }
      return params;
    });

    this.api
      .job('core.bulk', ['app.upgrade', payload])
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close();
        this.snackbar.success(
          this.translate.instant('Updating Apps. Please check on the progress in Task Manager.'),
        );
      });
  }

  private setInitialValues(): void {
    this.apps.forEach((app) => {
      this.bulkItems.set(app.name, { state: BulkListItemState.Initial, item: app });
      this.form.addControl(app.name, this.formBuilder.control<string>(app.latest_version));
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
      .subscribe(([appName, version]) => {
        const app = this.bulkItems.get(appName)?.item;
        if (app) {
          this.getUpgradeSummary(app, version || undefined);
        }
      });
  }
}
