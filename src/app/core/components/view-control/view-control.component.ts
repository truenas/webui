import { Component } from '@angular/core';
import { ViewControl } from 'app/core/classes/viewcontrol';

@Component({
  selector: 'viewcontrol',
  templateUrl: './view-control.component.html',
})
export class ViewControlComponent extends ViewControl {
  readonly componentName = ViewControlComponent;
}
