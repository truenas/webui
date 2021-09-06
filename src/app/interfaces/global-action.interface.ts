import { Type } from '@angular/core';
import { EntityTableAddActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-add-actions.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { T } from 'app/translate-marker';
import { Subject } from 'rxjs';

export type GlobalActionConfig = EntityToolbarActionConfig | EntityTableAddActionsConfig;

export interface EntityToolbarActionConfig {
  actionType: Type<EntityToolbarComponent>;
  actionConfig: ToolbarConfig;
}

export interface EntityTableAddActionsConfig {
  actionType: EntityTableAddActionsComponent;
  actionConfig: this;
}

export interface GlobalAction {
  applyConfig(config: GlobalActionConfig['actionConfig']): void;
}
