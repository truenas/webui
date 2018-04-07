import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { TooltipPosition } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

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
  public tooltipSize: any;

  constructor(public translate: TranslateService) {}

  showTooltip($event) {
    this.isShowTooltip = $event;

    let screenW = document.body.clientWidth;
    let posX = this.tooltip.nativeElement.getBoundingClientRect().left;
    let dynamicWidth = this.message.length * 9.5;

    if(this.message.length <= 40) {
      if((screenW - posX) > 420) {
        this.tooltipMsgStyle = {'left' : '0px', 'max-width' : dynamicWidth + 'px'};
      }
      else if(posX > 420) {
        this.tooltipMsgStyle = {'right' : '0px', 'max-width' :  dynamicWidth + 'px'};
      }
      else {
        let diffX = 'calc( -45vw - ' + (posX - screenW/2) + 'px )';
        this.tooltipMsgStyle = {'left' : diffX, 'max-width' : dynamicWidth + 'px'};
      }    
    }
    else {
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
}
