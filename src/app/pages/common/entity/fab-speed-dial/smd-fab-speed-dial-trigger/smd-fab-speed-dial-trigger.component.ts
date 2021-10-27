import {
  Component, forwardRef, HostBinding, HostListener, Inject, Input,
} from '@angular/core';
import { SmdFabSpeedDialComponent } from 'app/pages/common/entity/fab-speed-dial/smd-fab-speed-dial.component';

@Component({
  selector: 'smd-fab-trigger',
  template: '<ng-content select="[mat-fab], [mat-fab]"></ng-content>',
})
export class SmdFabSpeedDialTriggerComponent {
  /**
   * Whether this trigger should spin (360dg) while opening the speed dial
   */
  @HostBinding('class.smd-spin')
  @Input() spin = false;

  constructor(@Inject(forwardRef(() => SmdFabSpeedDialComponent)) private _parent: SmdFabSpeedDialComponent) {
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this._parent.fixed) {
      this._parent.toggle();
      event.stopPropagation();
    }
  }
}
