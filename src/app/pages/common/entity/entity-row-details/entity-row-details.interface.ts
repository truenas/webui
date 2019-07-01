import { Component } from "@angular/core";
import { EntityTableComponent } from "../entity-table/entity-table.component";

/**
 * @description A common interface for EntityTable summary row components.
 *
 * @param T Row detail object type
 * @param U Entity table component (by default)
 *
 * Note that config and parent are [at]Input properties in the implemeting class.
 */
export interface EntityRowDetails<T = any, U = EntityTableComponent> extends Component {
  entityName: string;
  config: T;
  parent: U;

  details: { label: string; value: string | number }[];

  actions?: EntityAction[];

  isActionVisible?(actionId: string, entity: T): boolean;
}

export interface EntityAction {
  id: string;
  label: string;
  icon: string;
  name: string;
  onClick: (args?: any) => any | void;
  visible?: (args?: any) => boolean | boolean;
}
