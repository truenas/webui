import {
  Directive, ElementRef, HostListener, OnInit,
} from '@angular/core';
import * as domHelper from 'app/helpers/dom.helper';

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
    const accordionItems = document.getElementsByClassName('app-accordion');
    if (domHelper.hasClass(this.parentLi, 'open')) {
      domHelper.removeClass(accordionItems as HTMLCollectionOf<HTMLElement>, 'open');
    } else {
      domHelper.removeClass(accordionItems as HTMLCollectionOf<HTMLElement>, 'open');
      domHelper.addClass(this.parentLi, 'open');
    }
  }
}
