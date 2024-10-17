import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, OnInit, output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, take } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  NetdataDialogComponent,
} from 'app/pages/reports-dashboard/components/reports-global-controls/netdata-dialog/netdata-dialog.component';
import { reportingGlobalControlsElements } from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.elements';
import { ReportTab, ReportType } from 'app/pages/reports-dashboard/interfaces/report-tab.interface';
import { ReportsService } from 'app/pages/reports-dashboard/reports.service';
import { AppState } from 'app/store';
import { autoRefreshReportsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxSlideToggleComponent,
    MatButton,
    TestDirective,
    MatMenuTrigger,
    UiSearchDirective,
    IxIconComponent,
    MatMenu,
    NgTemplateOutlet,
    MatMenuItem,
    TranslateModule,
    RouterLink,
  ],
})
export class ReportsGlobalControlsComponent implements OnInit {
  readonly diskOptionsChanged = output<{ devices: string[]; metrics: string[] }>();

  form = this.fb.group({
    autoRefresh: [false],
    devices: [[] as string[]],
    metrics: [[] as string[]],
  });

  activeTab: ReportTab;
  allTabs: ReportTab[];
  diskDevices$ = this.reportsService.getDiskDevices();
  diskMetrics$ = this.reportsService.getDiskMetrics();

  readonly ReportType = ReportType;
  readonly searchableElements = reportingGlobalControlsElements;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.setupTabs();
    this.setAutoRefreshControl();
    this.setupDisksTab();
  }

  isActiveTab(tab: ReportTab): boolean {
    return this.activeTab?.value === tab.value;
  }

  typeTab(tab: ReportTab): ReportTab {
    return tab;
  }

  private setupTabs(): void {
    this.reportsService.getReportGraphs()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.allTabs = this.reportsService.getReportTabs();
        this.activeTab = this.allTabs.find((tab) => {
          return tab.value === (this.route.routeConfig.path as ReportType);
        });
        this.cdr.markForCheck();
      });
  }

  private setupDisksTab(): void {
    if (this.activeTab?.value !== ReportType.Disk) {
      return;
    }
    this.form.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((values) => {
      this.diskOptionsChanged.emit({
        devices: values.devices,
        metrics: values.metrics,
      });
    });
    this.diskDevices$.pipe(untilDestroyed(this)).subscribe((disks) => {
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

  openNetdata(): void {
    this.matDialog.open(NetdataDialogComponent);
  }
}
