import {Component, Input} from '@angular/core';
import {TooltipPosition} from '@angular/material';

@Component({
  selector : 'tooltip',
  templateUrl : 'tooltip.component.html',
  styleUrls : [ 'tooltip.component.css' ],
})
export class TooltipComponent {
  @Input('message') message: string;

  position: TooltipPosition = 'below';
  disabled = false;
  showDelay = 0;
  hideDelay = 1000;
}