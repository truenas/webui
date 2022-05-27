import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { ReportTab } from 'app/enums/report-tab.enum';
import { ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Tab } from 'app/pages/reports-dashboard/reports-dashboard.component';

@Component({
  selector: 'reports-global-controls',
  templateUrl: './reports-global-controls.component.html',
  styleUrls: ['./reports-global-controls.component.scss'],
})
export class ReportsGlobalControlsComponent {
  @Input() activeTab: Tab;
  @Input() allTabs: Tab[];
  @Input() activeTabVerified: boolean;
  @Input() toolbarConfig: ToolbarConfig;

  @Output() showConfigForm = new EventEmitter<void>();
  @Output() navigateToTab = new EventEmitter<Tab>();

  readonly ReportTab = ReportTab;

  onShowConfigForm(): void {
    this.showConfigForm.emit();
  }

  onNavigateToTab(tab: Tab): void {
    this.navigateToTab.emit(tab);
  }
}
