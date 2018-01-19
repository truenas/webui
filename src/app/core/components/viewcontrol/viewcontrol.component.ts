import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { CoreEvent } from 'app/core/services/core.service';
import { ViewControl } from 'app/core/classes/viewcontrol';

@Component({
  selector: 'viewcontrol',
  templateUrl: './viewcontrol.component.html',
  styleUrls: ['./viewcontrol.component.css']
})
export class ViewControlComponent extends ViewControl {

  readonly componentName = ViewControlComponent;

  constructor() {
    super();
  }

  ngOnInit() {
  }

}
