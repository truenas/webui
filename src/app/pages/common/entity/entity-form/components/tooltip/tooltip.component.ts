import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector : 'tooltip',
  templateUrl : 'tooltip.component.html',
  styleUrls : [ 'tooltip.component.css' ],
})
export class TooltipComponent {
  @Input('message') message: string;
  @Input('header') header?: string;
  @Input('position') positionOverride?: string;
  @ViewChild('tooltip', { static: true}) private tooltip: ElementRef;
  @ViewChild(CdkDrag, {static: true}) dragTarget: CdkDrag;

  public isShowTooltip: boolean;
  public tooltipMsgStyle: any;
  public isWizard: boolean = false;

  public positionString: string = 'Default';
  public isMoved: boolean = false;

  public previousTooltip = [];

  constructor(public translate: TranslateService) {}

  showTooltip($event) {
    this.isShowTooltip = $event;
    let formParent = this.findParent();
    let posRight = this.tooltip.nativeElement.offsetLeft + this.tooltip.nativeElement.offsetWidth;
    this.tooltipMsgStyle = {
      'right': '32px',
      'top':'-32px',
      'min-height':'64px'
    };

    let insideJob = formParent ? (formParent.clientWidth - posRight > 300 ? true : false) : null;

    if(this.positionOverride){
      this.positionString = this.positionOverride;
    } else {
      this.positionString = insideJob ? 'right' : 'left';
    }
  }

  toggleVis(this) {
    const el = this.tooltip.nativeElement.children[1].children[0].classList;
    let show = false;
    for (let i = 0; i < el.length; i++) {
      if (el[i] === 'show') {
        show = true;
      }
    }

    const tooltips: any = document.getElementsByClassName('tooltip-container');
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].firstChild.classList.remove('show');
    }
   
    if (!show) {
      el.add('show');
      this.dragTarget.reset();
      this.isMoved = false;
      this.showTooltip(true);
      this.isShowTooltip = true;
    } else {
      this.showTooltip(false);
      this.isShowTooltip = false;
    }
  }

  findParent(){
    let formParent = this.tooltip.nativeElement.offsetParent;
    let card;
    if (this.tooltip.nativeElement.closest('mat-dialog-container')) {
      card = this.tooltip.nativeElement.closest('mat-dialog-container');
      this.positionOverride = 'right';
    } else if(formParent.tagName.toLowerCase() == 'mat-card'){
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

    if(card && card.parentNode.nodeName.toLowerCase() == 'entity-wizard'){
      this.isWizard = true;
    }

    return card;
  }

  hideTail(evt?){
    this.isMoved = true;
  }

}
