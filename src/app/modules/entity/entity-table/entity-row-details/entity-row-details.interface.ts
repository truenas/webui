import { Component } from '@angular/core';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';

/**
 * @description A common interface for EntityTable summary row components.
 *
 * @param T Row detail object type
 * @param U Entity table component (by default)
 *
 * Note that config and parent are [at]Input properties in the implemeting class.
 */
export interface EntityRowDetails<T = unknown, U = EntityTableComponent> extends Component {
  entityName: string;
  config: T;
  parent: U;

  details: EntityDetail[];

  actions?: EntityAction[];

  isActionVisible?(actionId: string, entity: T): boolean;
}

export interface EntityAction {
  id: string;
  label: string;
  icon: string;
  name: string;
  onClick: (args?: unknown) => unknown;
  visible?: (args?: unknown) => boolean;
}

export interface EntityDetail {
  label: string;
  value: string | number;
}
