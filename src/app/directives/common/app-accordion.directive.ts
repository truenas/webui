import {
  Directive, ElementRef, Input, Output, HostBinding, HostListener, EventEmitter, OnInit,
} from '@angular/core';
import {
  Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot,
} from '@angular/router';
import * as domHelper from '../../helpers/dom.helper';

@Directive({ selector: '[appAccordion]' })
export class AppAccordionDirective implements OnInit {
  parentLi: HTMLElement;

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.el.nativeElement.className += 'accordion-handle';
      if (domHelper.hasClass(this.el.nativeElement, 'app-accordion')) {
        this.parentLi = this.el.nativeElement;
      } else {
        this.parentLi = domHelper.findClosest(this.el.nativeElement, 'app-accordion');
      }
    });
  }

  @HostListener('click')
  onClick(): void {
    this.toggleOpen();
  }

  private toggleOpen(): void {
    var accordionItems = document.getElementsByClassName('app-accordion');
    if (domHelper.hasClass(this.parentLi, 'open')) {
      domHelper.removeClass(accordionItems, 'open');
    } else {
      domHelper.removeClass(accordionItems, 'open');
      domHelper.addClass(this.parentLi, 'open');
    }
  }
}
