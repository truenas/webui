/**
 * @author Aaron Ervin | aervin [at] ixsystems.com
 * Ripped from https://stackblitz.com/edit/wizdm-contextmenu
 *
 * Note that the menu is defined by the declaring component.
 */

import { Component, HostBinding, Input } from "@angular/core";
import { MatMenuTrigger } from "@angular/material";

@Component({
  selector: "app-context-menu",
  template: "<ng-content></ng-content>"
})
export class ContextMenuComponent extends MatMenuTrigger {
  /* Use these dial in the exact menu position required */
  @Input() public offsetX = -124;
  @Input() public offsetY = -16;

  @HostBinding("style.position") private _position = "fixed";
  @HostBinding("style.pointer-events") private _events = "none";
  @HostBinding("style.left") private _x: string;
  @HostBinding("style.top") private _y: string;

  public open({ x, y }: MouseEvent, data?: any) {
    /* Pass along the context data to support lazily-rendered content */
    if (!!data) this.menuData = data;

    /* Adjust the menu anchor position */
    this._x = x + this.offsetX + "px";
    this._y = y + this.offsetY + "px";

    /* Opens the menu */
    this.openMenu();

    /* Prevents default */
    return false;
  }
}
