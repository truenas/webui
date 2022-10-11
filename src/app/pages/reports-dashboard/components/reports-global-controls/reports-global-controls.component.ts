import {
  ChangeDetectionStrategy,
  Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ReportsConfigFormComponent } from 'app/pages/reports-dashboard/components/reports-config-form/reports-config-form.component';
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
  selectedDisks: string[];
  allTabs: ReportTab[] = this.reportsService.getReportTabs();
  diskDevices$ = this.reportsService.getDiskDevices();
  diskMetrics$ = this.reportsService.getDiskMetrics();
  @Output() diskOptionsChanged = new EventEmitter<{ devices: string[]; metrics: string[] }>();

  readonly ReportType = ReportType;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store$: Store<AppState>,
    private reportsService: ReportsService,
    private slideIn: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.activeTab = this.allTabs.find((tab) => tab.value === this.route.routeConfig.path);
    this.setAutoRefreshControl();
    this.setupDisksTab();
  }

  showConfigForm(): void {
    this.slideIn.open(ReportsConfigFormComponent);
  }

  onNavigateToTab(tab: ReportTab): void {
    this.router.navigate(['/reportsdashboard', tab.value]);
  }

  isActiveTab(tab: ReportTab): boolean {
    return this.activeTab.value === tab.value;
  }

  private setupDisksTab(): void {
    if (this.activeTab.value !== ReportType.Disk) {
      return;
    }
    if (this.route.snapshot.queryParams?.disks) {
      this.selectedDisks = this.route.snapshot.queryParams.disks;
    } else {
      this.selectedDisks = this.form.value.devices;
    }
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((values) => {
      this.diskOptionsChanged.emit({
        devices: values.devices,
        metrics: values.metrics,
      });
    });
    this.setupDisksToolbar();
  }

  private setupDisksToolbar(): void {
    this.diskDevices$.pipe(untilDestroyed(this)).subscribe((diskDevices) => {
      this.form.patchValue({ devices: diskDevices.map((device) => `${device.value}`) });
    });
    this.diskMetrics$.pipe(untilDestroyed(this)).subscribe((diskMetrics) => {
      this.form.patchValue({ metrics: diskMetrics.map((device) => `${device.value}`) });
    });
  }

  private setAutoRefreshControl(): void {
    this.store$.pipe(
      waitForPreferences,
      take(1),
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.form.patchValue({ autoRefresh: preferences.autoRefreshReports });
      this.form.get('autoRefresh').valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        this.store$.dispatch(autoRefreshReportsToggled());
      });
    });
  }
}
