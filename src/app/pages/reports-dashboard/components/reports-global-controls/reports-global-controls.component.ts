import {
  Component, EventEmitter, Input, OnChanges, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
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
})
export class ReportsGlobalControlsComponent implements OnChanges {
  @Input() activeTab: ReportTab;
  @Input() diskMetrics: Option[];
  @Input() diskDevices: Option[];
  @Input() selectedDisks: string[];
  @Input() allTabs: ReportTab[];
  @Input() activeTabVerified: boolean;

  @Output() showConfigForm = new EventEmitter<void>();
  @Output() navigateToTab = new EventEmitter<ReportTab>();
  @Output() diskOptionsChanged = new EventEmitter<{ devices: Option[]; metrics: Option[] }>();

  devicesControl: ControlConfig;
  metricsControl: ControlConfig;
  autoRefreshEnabled = false;

  readonly ReportType = ReportType;

  constructor(
    private reportsService: ReportsService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.allTabs = this.reportsService.getReportTabs();
    this.setAutoRefreshControl();
    this.setDiskControls();
  }

  onShowConfigForm(): void {
    this.showConfigForm.emit();
  }

  onNavigateToTab(tab: ReportTab): void {
    this.navigateToTab.emit(tab);
  }

  onDiskOptionsChanged(): void {
    this.diskOptionsChanged.emit({
      devices: this.devicesControl.value,
      metrics: this.metricsControl.value,
    });
  }

  toggleAutoRefresh(): void {
    this.store$.dispatch(autoRefreshReportsToggled());
  }

  private setAutoRefreshControl(): void {
    this.store$.pipe(
      waitForPreferences,
      untilDestroyed(this),
    ).subscribe((preferences) => {
      this.autoRefreshEnabled = preferences.autoRefreshReports;
    });
  }

  private setDiskControls(): void {
    this.devicesControl = {
      label: this.translate.instant('Devices'),
      placeholder: this.translate.instant('Devices'),
      multiple: true,
      options: this.diskDevices,
      customTriggerValue: this.translate.instant('Select Disks'),
      value: this.diskDevices?.length && this.selectedDisks
        ? this.diskDevices.filter((device) => this.selectedDisks.includes(device.value as string))
        : [],
    };

    this.metricsControl = {
      label: this.translate.instant('Metrics'),
      placeholder: this.translate.instant('Metrics'),
      customTriggerValue: this.translate.instant('Select Reports'),
      multiple: true,
      options: this.diskMetrics ? this.diskMetrics : [this.translate.instant('Not Available')],
      value: this.selectedDisks ? this.diskMetrics : [],
    };
  }
}
