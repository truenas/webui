import 'style-loader!./baSidebar.scss';

import {Component, ElementRef, HostListener} from '@angular/core';

import {GlobalState} from '../../../global.state';
import {layoutSizes} from '../../../theme';

@Component({selector : 'ba-sidebar', templateUrl : './baSidebar.html'})
export class BaSidebar {
  public menuHeight: number;
  public isMenuCollapsed: boolean = false;
  public isMenuShouldCollapsed: boolean = false;

  constructor(private _elementRef: ElementRef, private _state: GlobalState) {

    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });
  }

  public ngOnInit(): void {
    if (this._shouldMenuCollapse()) {
      this.menuCollapse();
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => this.updateSidebarHeight());
  }

  @HostListener('window:resize')
  public onWindowResize(): void {

    var isMenuShouldCollapsed = this._shouldMenuCollapse();

    if (this.isMenuShouldCollapsed !== isMenuShouldCollapsed) {
      this.menuCollapseStateChange(isMenuShouldCollapsed);
    }
    this.isMenuShouldCollapsed = isMenuShouldCollapsed;
    this.updateSidebarHeight();
  }

  public menuExpand(): void { this.menuCollapseStateChange(false); }

  public menuCollapse(): void { this.menuCollapseStateChange(true); }

  public menuCollapseStateChange(isCollapsed: boolean): void {
    this.isMenuCollapsed = isCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
  }

  public updateSidebarHeight(): void {
    // TODO: get rid of magic 84 constant
    this.menuHeight =
        this._elementRef.nativeElement.childNodes[0].clientHeight - 84;
  }

  public _shouldMenuCollapse(): boolean {
    return window.innerWidth <= layoutSizes.resWidthCollapseSidebar;
  }

  public autoCollapse(): void {
    if (this._shouldMenuCollapse()) {
      this.menuCollapse();
    }
  }
}
