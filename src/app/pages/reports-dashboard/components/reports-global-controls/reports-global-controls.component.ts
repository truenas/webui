import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, take } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { autoRefreshReportsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsGlobalControlsComponent implements OnInit {
  form = this.fb.group({
    autoRefresh: [false],
    devices: [[] as string[]],
    metrics: [[] as string[]],
  });
  activeTab: ReportTab;
  allTabs: ReportTab[];
  diskDevices$ = this.reportsService.getDiskDevices();
  diskMetrics$ = this.reportsService.getDiskMetrics();
  @Output() diskOptionsChanged = new EventEmitter<{ devices: string[]; metrics: string[] }>();
  diskDevicesOptions$ = new BehaviorSubject<Option[]>([]);
  allDiskDevices: Option[];

  readonly ReportType = ReportType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private reportsService: ReportsService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.setupTabs();
    this.setAutoRefreshControl();
    this.setupDisksTab();
    this.setupDevicesFiltering();
  }

  setupDevicesFiltering(): void {
    combineLatest([
      this.reportsService.getReportGraphs(),
      this.form.controls.metrics.valueChanges,
    ]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: ([graphs, metrics]: [ReportingGraph[], string[]]) => {
        this.diskDevicesOptions$.next(this.allDiskDevices.filter((device) => {
          for (const metric of metrics) {
            const selectedGraph = graphs.find((graph) => graph.name === metric);
            if (selectedGraph?.identifiers.includes(device.value.toString())) {
              return true;
            }
          }
          return false;
        }));
      },
    });
  }

  isActiveTab(tab: ReportTab): boolean {
    return this.activeTab?.value === tab.value;
  }

  private setupTabs(): void {
    this.reportsService.getReportGraphs().pipe(untilDestroyed(this)).subscribe(() => {
      this.allTabs = this.reportsService.getReportTabs();
      this.activeTab = this.allTabs.find((tab) => tab.value === this.route.routeConfig.path);
      this.cdr.markForCheck();
    });
  }

  private setupDisksTab(): void {
    if (this.activeTab?.value !== ReportType.Disk) {
      return;
    }
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((values) => {
      this.diskOptionsChanged.emit({
        devices: values.devices,
        metrics: values.metrics,
      });
    });
    this.diskDevices$.pipe(untilDestroyed(this)).subscribe((disks) => {
      this.allDiskDevices = disks;
      const disksNames = this.route.snapshot.queryParams.disks as string[] | string;
      let devices: string[];
      if (disksNames) {
        devices = Array.isArray(disksNames) ? disksNames : [disksNames];
      } else {
        devices = disks.map((device) => String(device.value));
      }
      this.form.patchValue({ devices });
    });
    this.diskMetrics$.pipe(untilDestroyed(this)).subscribe((metrics) => {
      this.form.patchValue({ metrics: metrics.map((device) => String(device.value)) });
    });
  }

  private setAutoRefreshControl(): void {
    this.store$.pipe(
      waitForPreferences,
      take(1),
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.form.patchValue({ autoRefresh: preferences.autoRefreshReports });
      this.form.controls.autoRefresh.valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        this.store$.dispatch(autoRefreshReportsToggled());
      });
    });
  }
}
