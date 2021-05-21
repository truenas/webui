import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { ViewControl } from 'app/core/classes/viewcontrol';

@Component({
  selector: 'viewcontrol',
  templateUrl: './viewcontrol.component.html',
  styleUrls: ['./viewcontrol.component.css'],
})
export class ViewControlComponent extends ViewControl {
  readonly componentName = ViewControlComponent;
}
