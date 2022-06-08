import {
  Component, EventEmitter, Input, OnChanges, Output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ReportTab } from 'app/enums/report-tab.enum';
import { Option } from 'app/interfaces/option.interface';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Tab } from 'app/pages/reports-dashboard/reports-dashboard.component';

@UntilDestroy()
@Component({
  selector: 'ix-reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
})
export class ReportsGlobalControlsComponent implements OnChanges {
  @Input() activeTab: Tab;
  @Input() diskMetrics: Option[];
  @Input() diskDevices: Option[];
  @Input() selectedDisks: string[];
  @Input() allTabs: Tab[];
  @Input() activeTabVerified: boolean;

  @Output() showConfigForm = new EventEmitter<void>();
  @Output() navigateToTab = new EventEmitter<Tab>();
  @Output() diskOptionsChanged = new EventEmitter<{ devices: Option[]; metrics: Option[] }>();

  devicesControl: ControlConfig;
  metricsControl: ControlConfig;

  readonly ReportTab = ReportTab;

  constructor(
    private translate: TranslateService,
  ) {}

  onShowConfigForm(): void {
    this.showConfigForm.emit();
  }

  onNavigateToTab(tab: Tab): void {
    this.navigateToTab.emit(tab);
  }

  ngOnChanges(): void {
    this.setDiskControls();
  }

  onDiskOptionsChanged(): void {
    this.diskOptionsChanged.emit({
      devices: this.devicesControl.value,
      metrics: this.metricsControl.value,
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
