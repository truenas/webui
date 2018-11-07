import { Component, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
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
    let screenH = document.body.clientHeight;
    let posX = this.tooltip.nativeElement.getBoundingClientRect().left;
    let posY = this.tooltip.nativeElement.getBoundingClientRect().bottom;
    let dynamicWidth = this.message.length * 9.5;

    if((posY / screenH > .85)) {
      this.tooltip.nativeElement.lastElementChild.id = "raised-tooltip";
    } else {
      this.tooltip.nativeElement.lastElementChild.id = "";
    }

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
