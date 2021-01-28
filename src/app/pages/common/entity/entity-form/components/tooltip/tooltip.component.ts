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
  @ViewChild('tooltiptext', {static: true}) private tooltiptext: ElementRef;

  public isShowTooltip: boolean;
  public tooltipMsgStyle: any;
  public isWizard: boolean = false;
  public isSlideInForm = false;

  public positionString: string = 'Default';
  public isMoved: boolean = false;

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
    if (this.isSlideInForm && formParent.clientWidth < 420) {
      if (posRight < 200) {
        this.positionOverride = 'center';
      } else {
        this.positionOverride = 'center-left';
      }
    }

    let insideJob = formParent ? (formParent.clientWidth - posRight > 300 ? true : false) : null;

    if(this.positionOverride){
      this.positionString = this.positionOverride;
    } else {
      this.positionString = insideJob ? 'right' : 'left';
    }
  }

  toggleVis() {
    /* Resets 'isShowTooltip' for any tooltip closed by removing the class (below)
     so it will reopen on first click */
    const el = this.tooltiptext.nativeElement.classList
    this.isShowTooltip = false;
    for (let i = 0; i < el.length; i++) {
      if (el[i] === 'show') {
        // Or, if tooltip is already open, close it
        this.isShowTooltip = true;
      }
    }
    // Clears any open tooltip from screen
    const tooltips: any = document.getElementsByClassName('tooltip-container');
    for (let i = 0; i < tooltips.length; i++) {
      tooltips[i].firstChild.classList.remove('show');
    }
   
    if (!this.isShowTooltip) {
      this.isShowTooltip = true;
      el.add('show');
      this.dragTarget.reset();
      this.isMoved = false;
      this.showTooltip(true);
      
    } else {
      this.showTooltip(false);
      this.isShowTooltip = false;
    }
  }

  findParent(){
    let formParent = this.tooltip.nativeElement.offsetParent;
    let card = formParent;
    if (this.tooltip.nativeElement.closest('mat-dialog-container')) {
      card = this.tooltip.nativeElement.closest('mat-dialog-container');
      this.positionOverride = 'right';
    } else if(formParent && formParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent;
    } else if(formParent.offsetParent && formParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent && formParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent.offsetParent && formParent.offsetParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent.offsetParent;
    } else if(formParent.offsetParent.offsetParent.offsetParent.offsetParent && formParent.offsetParent.offsetParent.offsetParent.offsetParent.tagName.toLowerCase() == 'mat-card'){
      card = formParent.offsetParent.offsetParent.offsetParent.offsetParent;
    }
    this.isSlideInForm = card.parentNode.classList.value.includes('slidein-entity-form');

    if(card && card.parentNode.nodeName.toLowerCase() == 'entity-wizard'){
      this.isWizard = true;
    }

    return card;
  }

  hideTail(evt?){
    this.isMoved = true;
  }

}
