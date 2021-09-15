import { Type } from '@angular/core';
import { EntityTableAddActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-add-actions/entity-table-add-actions.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { ReportsGlobalControlsComponent } from 'app/pages/reports-dashboard/components/reports-global-controls/reports-global-controls.component';
import { ReportsDashboardComponent } from 'app/pages/reports-dashboard/reports-dashboard.component';
import { VolumesListControlsComponent } from 'app/pages/storage/volumes/volume-list-controls/volumes-list-controls.component';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';

export type GlobalActionConfig = EntityToolbarActionConfig
| EntityTableAddActionsConfig
| VolumesListControlsActionsConfig
| ReportsGlobalControlsActionsConfig;

export interface EntityToolbarActionConfig {
  actionType: Type<EntityToolbarComponent>;
  actionConfig: ToolbarConfig;
}

export interface EntityTableAddActionsConfig {
  actionType: Type<EntityTableAddActionsComponent>;
  actionConfig: EntityTableComponent;
}

export interface VolumesListControlsActionsConfig {
  actionType: Type<VolumesListControlsComponent>;
  actionConfig: VolumesListComponent;
}

export interface ReportsGlobalControlsActionsConfig {
  actionType: Type<ReportsGlobalControlsComponent>;
  actionConfig: ReportsDashboardComponent;
}

export interface GlobalAction {
  applyConfig(config: GlobalActionConfig['actionConfig']): void;
}
