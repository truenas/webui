import { Inject, Injectable } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take, filter, distinctUntilChanged } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { sidenavIndicatorPressed, sidenavUpdated } from 'app/store/topbar/topbar.actions';

export const collapsedMenuClass = 'collapsed-menu';

@Injectable({
  providedIn: 'root',
})
export class SidenavService {
  sidenav: MatSidenav;
  isOpen = true;
  isCollapsed = false;
  mode: MatDrawerMode = 'over';

  get sidenavWidth(): string {
    const iconified = this.isMenuCollapsed;
    if (this.isOpen && iconified && this.mode === 'side') {
      return '48px';
    }
    if (this.isOpen && !iconified && this.mode === 'side') {
      return '240px';
    }
    return '0px';
  }

  constructor(
    private layoutService: LayoutService,
    private mediaService: MediaObserver,
    private store$: Store<AppState>,
    private actions$: Actions,
    @Inject(WINDOW) private window: Window,
  ) {
    this.listenForScreenSizeChanges();
    this.listenForSidenavToggle();
  }

  setSidenav(sidenav: MatSidenav): void {
    this.sidenav = sidenav;
  }

  getSidenav(): MatSidenav {
    return this.sidenav;
  }

  setSidenavStatus(sidenav: SidenavStatusData): void {
    this.isOpen = sidenav.isOpen;
    this.mode = sidenav.mode;
    this.isCollapsed = sidenav.isCollapsed;
  }

  private listenForScreenSizeChanges(): void {
    this.mediaService.asObservable().subscribe(() => {
      this.isOpen = !this.isMobile;
      this.mode = this.isMobile ? 'over' : 'side';
      if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://ixsystems.atlassian.net/browse/NAS-110404
        setTimeout(() => {
          this.sidenav.open();
        });
        this.store$.pipe(
          waitForPreferences,
          take(1),
          filter((preferences) => Boolean(preferences.sidenavStatus)),
        ).subscribe(({ sidenavStatus }) => {
          this.isMenuCollapsed = sidenavStatus.isCollapsed;
          this.isCollapsed = sidenavStatus.isCollapsed;
        });
      } else {
        this.isMenuCollapsed = false;
        this.isOpen = false;
      }
    });
  }

  private listenForSidenavToggle(): void {
    this.actions$
      .pipe(
        ofType(sidenavIndicatorPressed),
        distinctUntilChanged(),
      ).subscribe(() => {
        this.toggleSidenav();
      });
  }

  get isMobile(): boolean {
    return this.window.innerWidth < 960;
  }

  get isMenuCollapsed(): boolean {
    return document.getElementsByClassName(collapsedMenuClass).length === 1;
  }

  set isMenuCollapsed(isCollapsed: boolean) {
    const appBody = document.body;

    if (isCollapsed) {
      appBody.classList.add(collapsedMenuClass);
    } else {
      appBody.classList.remove(collapsedMenuClass);
    }

    for (const element of document.getElementsByClassName('has-submenu') as HTMLCollectionOf<HTMLElement>) {
      element.classList.remove('open');
    }
  }

  private toggleSidenav(): void {
    if (this.isMobile) {
      this.sidenav?.toggle();
    } else {
      this.sidenav?.open();
      this.isMenuCollapsed = !this.isMenuCollapsed;
    }

    const data: SidenavStatusData = {
      isOpen: this.sidenav.opened,
      mode: this.sidenav.mode,
      isCollapsed: this.isMenuCollapsed,
    };

    if (!this.isMobile) {
      this.store$.dispatch(sidenavUpdated(data));
    }

    this.setSidenavStatus(data);
  }
}
