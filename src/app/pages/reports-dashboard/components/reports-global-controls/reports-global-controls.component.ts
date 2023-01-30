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
    return this.activeTab?.value === tab.value;
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
      const disksNames = this.route.snapshot.queryParams.disks;
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
