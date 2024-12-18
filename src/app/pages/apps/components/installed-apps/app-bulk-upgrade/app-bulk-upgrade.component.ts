import { KeyValue, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  signal,
  TrackByFunction,
} from '@angular/core';
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
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-bulk-upgrade',
  templateUrl: './app-bulk-upgrade.component.html',
  styleUrls: ['./app-bulk-upgrade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  ],
})
export class AppBulkUpgradeComponent {
  readonly expandedItems = signal<string[]>([]);

  form = this.formBuilder.group<Record<string, string>>({});
  bulkItems = new Map<string, BulkListItem<App>>();
  loadingMap = new Map<string, boolean>();
  optionsMap = new Map<string, Observable<Option[]>>();
  upgradeSummaryMap = new Map<string, AppUpgradeSummary>();

  readonly trackByKey: TrackByFunction<KeyValue<string, BulkListItem<App>>> = (_, entry) => entry.key;
  readonly imagePlaceholder = appImagePlaceholder;
  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<AppBulkUpgradeComponent>,
    private appService: ApplicationsService,
    private snackbar: SnackbarService,
    @Inject(MAT_DIALOG_DATA) private apps: App[],
  ) {
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

    this.getUpgradeSummary(row.value.item.name);
  }

  isItemExpanded(row: KeyValue<string, BulkListItem<App>>): boolean {
    return this.expandedItems().includes(row.key);
  }

  getUpgradeSummary(name: string, version?: string): void {
    this.loadingMap.set(name, true);
    this.appService
      .getAppUpgradeSummary(name, version)
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
        error: (error: unknown) => {
          console.error(error);
          this.loadingMap.set(name, false);
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
        params.push({ app_version: version });
      }
      return params;
    });

    this.api
      .job('core.bulk', ['app.upgrade', payload])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.dialogRef.close();
        this.snackbar.success(
          this.translate.instant('Upgrading Apps. Please check on the progress in Task Manager.'),
        );
      });
  }

  private setInitialValues(): void {
    this.apps.forEach((app) => {
      this.bulkItems.set(app.name, { state: BulkListItemState.Initial, item: app });
      const [, latestVersion] = app.metadata.app_version.split('_');
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
