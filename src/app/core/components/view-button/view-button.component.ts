import { Component } from '@angular/core';
import { ViewControlComponent } from 'app/core/components/view-control/view-control.component';

@Component({
  selector: 'viewbutton',
  templateUrl: './view-button.component.html',
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
