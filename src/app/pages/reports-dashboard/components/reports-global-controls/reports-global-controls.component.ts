import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent } from '@truenas/ui-components';
import { BehaviorSubject, debounceTime, take } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { reportingGlobalControlsElements } from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.elements';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { AppState } from 'app/store';
import { autoRefreshReportsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

/**
 * these were the only supported report types before migration and were
 * hard-coded into the HTML template.
 */
const supportedReportTypes = [
  ReportType.Cpu,
  ReportType.Disk,
  ReportType.Memory,
  ReportType.Network,
  ReportType.System,
  ReportType.Ups,
  ReportType.Zfs,
];

@Component({
  selector: 'ix-reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxSlideToggleComponent,
    TnButtonComponent,
    UiSearchDirective,
    TranslateModule,
  ],
})
export class ReportsGlobalControlsComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store$ = inject<Store<AppState>>(Store);
  private reportsService = inject(ReportsService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  readonly diskOptionsChanged = output<{ devices: string[]; metrics: string[] }>();

  protected form = this.fb.group({
    autoRefresh: [false],
    devices: [[] as string[]],
    metrics: [[] as string[]],
    tab: [undefined as ReportType | undefined],
  });

  protected tabOptions$ = new BehaviorSubject<SelectOption[]>([]);

  protected activeTab: ReportTab | undefined;
  protected allTabs: ReportTab[];
  protected diskDevices$ = this.reportsService.getDiskDevices();
  protected diskMetrics$ = this.reportsService.getDiskMetrics();

  protected readonly ReportType = ReportType;
  protected readonly searchableElements = reportingGlobalControlsElements;

  ngOnInit(): void {
    this.setupTabs();
    this.setAutoRefreshControl();
    this.setupDisksTab();
  }

  private setupTabs(): void {
    this.reportsService.getReportGraphs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.allTabs = this.reportsService.getReportTabs();
        this.activeTab = this.allTabs.find((tab) => {
          return tab.value === (this.route.routeConfig?.path as ReportType);
        });

        /**
         * set `tabOptions$` by filtering on `supportedReportTypes` - unsupported report
         * types should be excluded from the list since they'll just navigate the user to the
         * dashboard.
         */
        this.tabOptions$.next(
          this.allTabs
            .filter((tab) => supportedReportTypes.includes(tab.value))
            .map((tab) => ({ label: this.translate.instant(tab.label), value: tab.value })),
        );
        this.form.patchValue({ tab: this.activeTab?.value }, { emitEvent: false });
        this.cdr.markForCheck();
      });

    this.form.controls.tab.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      if (value) this.router.navigate(['/reportsdashboard', value]);
    });
  }

  private setupDisksTab(): void {
    if (this.activeTab?.value !== ReportType.Disk) {
      return;
    }
    this.form.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.diskOptionsChanged.emit({
        devices: values.devices || [],
        metrics: values.metrics || [],
      });
    });
    this.diskDevices$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((disks) => {
      const disksNames = this.route.snapshot.queryParams.disks as string[] | string;
      let devices: string[];
      if (disksNames) {
        devices = Array.isArray(disksNames) ? disksNames : [disksNames];
      } else {
        devices = disks.map((device) => String(device.value));
      }
      this.form.patchValue({ devices });
    });
    this.diskMetrics$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((metrics) => {
      this.form.patchValue({ metrics: metrics.map((device) => String(device.value)) });
    });
  }

  private setAutoRefreshControl(): void {
    this.store$.pipe(
      waitForPreferences,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((preferences) => {
      this.form.patchValue({ autoRefresh: preferences.autoRefreshReports });
      this.form.controls.autoRefresh.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.store$.dispatch(autoRefreshReportsToggled());
      });
    });
  }
}
