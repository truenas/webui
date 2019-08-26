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

  public isShowTooltip: boolean;
  public tooltipMsgStyle: any;
  public isLockTooltip: boolean = false;
  public isWizard: boolean = false

  public positionString: string = 'Default';

  constructor(public translate: TranslateService) {}

  showTooltip($event) {
    this.isShowTooltip = $event;

    //let formParent = this.tooltip.nativeElement.offsetParent;
    let formParent = this.findParent();

    let screenW = document.body.clientWidth;
    let screenH = document.body.clientHeight;
    let posX = this.tooltip.nativeElement.getBoundingClientRect().left;
    let posY = this.tooltip.nativeElement.getBoundingClientRect().bottom;

    let posLeft = this.tooltip.nativeElement.offsetLeft
    let posRight = this.tooltip.nativeElement.offsetLeft + this.tooltip.nativeElement.offsetWidth;
    let posTop = this.tooltip.nativeElement.offsetTop
    let posBottom = this.tooltip.nativeElement.offsetTop + this.tooltip.nativeElement.offsetHeight;

    let dynamicWidth = this.message.length * 8.5;
    let tooltipHeight = this.tooltip.nativeElement.scrollHeight;

    /*if (tooltipHeight > 200) {
      this.tooltip.nativeElement.lastElementChild.id = 'adjustme';
    } */

    this.tooltipMsgStyle = {
      'right': '32px',
      'top':'-32px',
      'min-height':'64px'
    };

    const fpr = formParent.offsetLeft + formParent.offsetWidth
    let insideJob = formParent.clientWidth - posRight > 200 ? true : false;
    this.positionString = insideJob ? 'above' : 'left';

  }

  toggleVis(state?) {
    if (state ==='lock') {
      this.showTooltip(true);
      this.isLockTooltip = true;
      this.isShowTooltip = true;
    } else {
      this.showTooltip(false);
      this.isLockTooltip = false;
      this.isShowTooltip = false;
    }
  }

  findParent(){
    console.log(this.tooltip); 
    let formParent = this.tooltip.nativeElement.offsetParent;
    let card;
    if(formParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent;
    } else if(formParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent.offsetParent.offsetParent;
    }

    if(card.parentNode.nodeName.toLowerCase() == 'entity-wizard'){
      this.isWizard = true;
    }

    return card;
  }

}
