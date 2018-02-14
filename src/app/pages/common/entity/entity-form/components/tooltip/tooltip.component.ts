import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { TooltipPosition } from '@angular/material';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector : 'tooltip',
  templateUrl : 'tooltip.component.html',
  styleUrls : [ 'tooltip.component.css' ],
})
export class TooltipComponent {
  @Input('message') message: string;
  @ViewChild('tooltip') private tooltip: ElementRef;

  public isShowTooltip: Boolean;
  public tooltipMsgStyle: any;

  constructor(public translate: TranslateService) {}

  showTooltip($event) {
    this.isShowTooltip = $event;

    let screenW = document.body.clientWidth;
    let posX = this.tooltip.nativeElement.getBoundingClientRect().left;

    if((screenW - posX) > 420) {
      this.tooltipMsgStyle = {'left' : '0px'};
    }
    else if(posX > 420) {
      this.tooltipMsgStyle = {'right' : '0px'};
    }
    else {
      let diffX = 'calc( -45vw - ' + (posX - screenW/2) + 'px )';
      this.tooltipMsgStyle = {'left' : diffX};
    }    
  }

}