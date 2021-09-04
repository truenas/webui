import {
  Directive, ElementRef, HostListener, OnInit,
} from '@angular/core';
import { LayoutService } from 'app/core/services/layout.service';
import * as domHelper from 'app/helpers/dom.helper';

@Directive({ selector: '[sideNavAccordion]' })
export class SideNavAccordionDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    const self = this;
    const subMenu = this.el.nativeElement.querySelector('.mat-list-item-content > mat-nav-list');
    const isCollapsed = this.layoutService.isMenuCollapsed;
    if (subMenu) this.el.nativeElement.className += ' has-submenu';

    // remove open class that is added my router
    if (isCollapsed) {
      setTimeout(() => {
        domHelper.removeClass(self.el.nativeElement, 'open');
      });
    }
  }

  @HostListener('click', ['$event'])
  onClick($event: MouseEvent): void {
    const target = $event.target as HTMLElement;
    const parentLi = domHelper.findClosest(target, 'mat-list-item');
    domHelper.addClass(target.parentElement, 'highlight');
    setTimeout(() => { domHelper.removeClass(target.parentElement, 'highlight'); }, 100);
    if (!domHelper.hasClass(parentLi, 'has-submenu')) {
      // PREVENTS CLOSING PARENT ITEM
      return;
    }
    this.toggleOpen();
  }

  // For collapsed sidebar
  @HostListener('mouseenter')
  onMouseEnter(): void {
    const elem = this.el.nativeElement;
    const isCollapsed = this.layoutService.isMenuCollapsed;
    if (!isCollapsed) return;
    domHelper.addClass(elem, 'open');
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    const elem = this.el.nativeElement;
    const isCollapsed = this.layoutService.isMenuCollapsed;
    if (!isCollapsed) return;
    domHelper.removeClass(elem, 'open');
  }

  private toggleOpen(): void {
    const elem = this.el.nativeElement;
    const parenMenuItems = document.getElementsByClassName('has-submenu') as HTMLCollectionOf<HTMLElement>;

    if (domHelper.hasClass(elem, 'open')) {
      domHelper.removeClass(parenMenuItems, 'open');
    } else {
      domHelper.removeClass(parenMenuItems, 'open');
      domHelper.addClass(elem, 'open');
    }
  }
}
