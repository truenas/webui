import { Component } from "@angular/core";
import { EntityTableComponent } from "./entity-table.component";

/**
 * @description A common interface for EntityTable summary row components.
 * 
 * @param T Row detail object type
 * @param U Entity table component (by default)
 * 
 * Note that config and parent are @Input properties in the implemeting class.
 */
export interface EntityTableRowDetailComponent<T = any, U = EntityTableComponent> extends Component {
    config: T;
    parent: U;

    actions?: any[];
}