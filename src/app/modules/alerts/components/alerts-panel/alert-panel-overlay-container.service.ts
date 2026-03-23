import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';

/**
 * Custom overlay container for the alert panel.
 * Adds a CSS class so it can be styled with a higher z-index than the alert panel (z-index: 1001),
 * ensuring mat-menus within the panel render on top.
 */
@Injectable()
export class AlertPanelOverlayContainer extends OverlayContainer {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  override _createContainer(): void {
    super._createContainer();
    this._containerElement.classList.add('alert-panel-overlay-container');
  }
}
