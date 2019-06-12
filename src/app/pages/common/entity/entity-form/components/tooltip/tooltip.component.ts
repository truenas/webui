import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector : 'tooltip',
  templateUrl : 'tooltip.component.html',
  styleUrls : [ 'tooltip.component.css' ],
})
export class TooltipComponent {
  @Input('message') message: string;
  @ViewChild('tooltip', { static: true}) private tooltip: ElementRef;

  public isShowTooltip: Boolean;
  public tooltipMsgStyle: any;
  public isLockTooltip: Boolean = false;

  constructor(public translate: TranslateService) {}

  showTooltip($event) {
    this.isShowTooltip = $event;

    let screenW = document.body.clientWidth;
    let screenH = document.body.clientHeight;
    let posX = this.tooltip.nativeElement.getBoundingClientRect().left;
    let posY = this.tooltip.nativeElement.getBoundingClientRect().bottom;
    let dynamicWidth = this.message.length * 8.5;
    
    if((posY / screenH > .85)) {
      this.tooltip.nativeElement.lastElementChild.id = "raised-tooltip";
    } else {
      this.tooltip.nativeElement.lastElementChild.id = "";
    }

    if(this.message.length <= 40) {
      if((posX/screenW) <= .6) {
        this.tooltipMsgStyle = {'left' : '0px', 'max-width' : dynamicWidth + 'px'};
      }
      else {
        this.tooltipMsgStyle = {'right' : '8px', 'max-width' :  dynamicWidth + 'px'};
      }
    }
    else {
      if((posX/screenW) <= .52) {
        this.tooltipMsgStyle = {'left' : '0px'};
      }
      else if((posX/screenW) <= .63) {
        this.tooltipMsgStyle = {'left' : '0px', 'max-width' : '270px'};
      }
      else {
        this.tooltipMsgStyle = {'right' : '8px'};
      }
    }
  }

  toggleVis() {
    this.isLockTooltip = !this.isLockTooltip;
    if (this.isLockTooltip === false) {
      this.isShowTooltip = false;
    }
  }
}
