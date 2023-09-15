import { Inject, Injectable } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDrawerMode, MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take, filter, distinctUntilChanged } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
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
  isOpenSecondaryMenu = false;
  menuName: string;
  subs: SubMenuItem[];

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

  constructor(
    private router: Router,
    private mediaService: MediaObserver,
    private store$: Store<AppState>,
    private actions$: Actions,
    @Inject(WINDOW) private window: Window,
  ) {
    this.listenForScreenSizeChanges();
    this.listenForRouteChanges();
    this.listenForSidenavIndicatorPressed();
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

  toggleSecondaryMenu(menuInfo?: [string, SubMenuItem[]]): void {
    const [state, subItems] = menuInfo || [];
    if ((this.isOpenSecondaryMenu && !menuInfo) || (this.isOpenSecondaryMenu && state === this.menuName)) {
      this.isOpenSecondaryMenu = false;
      this.subs = [];
    } else if (menuInfo) {
      this.menuName = state;
      this.subs = subItems;
      this.isOpenSecondaryMenu = true;
    }
  }

  closeSecondaryMenu(): void {
    this.isOpenSecondaryMenu = false;
  }

  private listenForScreenSizeChanges(): void {
    this.mediaService.asObservable().subscribe(() => {
      this.isOpen = !this.isMobile;
      this.mode = this.isMobile ? 'over' : 'side';
      if (!this.isMobile) {
      // TODO: This is hack to resolve issue described here: https://ixsystems.atlassian.net/browse/NAS-110404
        setTimeout(() => {
          this.sidenav?.open();
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

  private listenForSidenavIndicatorPressed(): void {
    this.actions$
      .pipe(
        ofType(sidenavIndicatorPressed),
        distinctUntilChanged(),
      ).subscribe(() => {
        this.toggleSidenav();
      });
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

  private listenForRouteChanges(): void {
    this.router.events.pipe(
      filter((routeChange) => routeChange instanceof NavigationEnd && this.isMobile),
    ).subscribe(() => {
      this.sidenav?.close();
    });
  }
}
