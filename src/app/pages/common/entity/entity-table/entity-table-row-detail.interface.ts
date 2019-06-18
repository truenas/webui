import { Component } from "@angular/core";
import { EntityTableComponent } from "./entity-table.component";

/**
 * @description A common interface for EntityTable summary row components.
 *
 * @param T Row detail object type
 * @param U Entity table component (by default)
 *
 * Note that config and parent are [at]Input properties in the implemeting class.
 */
export interface EntityTableRowDetailComponent<T = any, U = EntityTableComponent> extends Component {
  config: T;
  parent: U;

  actions?: EntityAction[];
}

export interface EntityAction {
  id: string | number;
  label: string;
  name?: string;
  onClick: (args?: any) => any | void;
  buttonColor?: "primary" | "accent" | "warn";
  icon?: string;
  visible?: (args?: any) => boolean | boolean;
}
