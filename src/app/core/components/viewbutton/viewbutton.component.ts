import { Component } from '@angular/core';
import { ViewControlComponent } from 'app/core/components/viewcontrol/viewcontrol.component';

@Component({
  selector: 'viewbutton',
  templateUrl: './viewbutton.component.html',
})
export class ViewButtonComponent extends ViewControlComponent {
  readonly componentName = ViewButtonComponent;
  raised = false;
  contextColor = 'primary';
  label = 'Button';
  tooltipEnabled = false;
  tooltipText: string;
  tooltipPlacement: string;
}
