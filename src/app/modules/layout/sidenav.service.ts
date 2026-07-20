import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DestroyRef, Injectable, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TnDrawerComponent, TnDrawerMode } from '@truenas/ui-components';
import { take, filter, distinctUntilChanged } from 'rxjs';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { sidenavIndicatorPressed, sidenavUpdated } from 'app/store/topbar/topbar.actions';

export const collapsedMenuClass = 'collapsed-menu';

const mobileBreakpoints = [Breakpoints.XSmall, Breakpoints.Small];

@Injectable({
  providedIn: 'root',
})
export class SidenavService {
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private store$ = inject<Store<AppState>>(Store);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);

  sidenav: TnDrawerComponent;
  isOpen = true;
  // TODO: How is this different from isMenuCollapsed?
  isCollapsed = false;
  mode: TnDrawerMode = 'over';
  isOpenSecondaryMenu = false;
  menuName: string;
  subs: SubMenuItem[];

  get sidenavWidth(): string {
    // In 'over' (mobile) mode the drawer overlays content at full menu width;
    // the open/closed state is what shows or hides it.
    if (this.mode === 'over') {
      return '240px';
    }
    const iconified = this.isMenuCollapsed;
    if (this.isOpen && iconified) {
      return '48px';
    }
    if (this.isOpen && !iconified) {
      return '240px';
    }
    return '0px';
  }

  readonly isMobile = signal(false);

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

  constructor() {
    // Seed from the current breakpoint synchronously so the first paint lays out in the
    // correct mode — waiting for the observer's first emission briefly renders the mobile
    // 'over' drawer on desktop and resizes the content area after load.
    const isMobile = this.breakpointObserver.isMatched(mobileBreakpoints);
    this.isMobile.set(isMobile);
    this.isOpen = !isMobile;
    this.mode = isMobile ? 'over' : 'side';

    this.listenForScreenSizeChanges();
    this.listenForRouteChanges();
    this.listenForSidenavIndicatorPressed();
  }

  setSidenav(sidenav: TnDrawerComponent): void {
    this.sidenav = sidenav;
  }

  setSidenavStatus(sidenav: SidenavStatusData): void {
    this.isOpen = sidenav.isOpen;
    this.mode = sidenav.mode;
    this.isCollapsed = sidenav.isCollapsed;
  }

  toggleSecondaryMenu(menuInfo?: [string, SubMenuItem[]]): void {
    if ((this.isOpenSecondaryMenu && !menuInfo) || (this.isOpenSecondaryMenu && menuInfo?.[0] === this.menuName)) {
      this.isOpenSecondaryMenu = false;
      this.subs = [];
    } else if (menuInfo) {
      const [state, subItems] = menuInfo;
      this.menuName = state;
      this.subs = subItems;
      this.isOpenSecondaryMenu = true;
    }
  }

  closeSecondaryMenu(): void {
    this.isOpenSecondaryMenu = false;
  }

  private listenForScreenSizeChanges(): void {
    this.breakpointObserver
      .observe(mobileBreakpoints)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        const isMobile = state.matches;
        this.isMobile.set(isMobile);
        this.isOpen = !isMobile;
        this.mode = isMobile ? 'over' : 'side';
        if (!isMobile) {
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
    if (this.isMobile()) {
      this.sidenav?.toggle();
    } else {
      this.sidenav?.open();
      this.isMenuCollapsed = !this.isMenuCollapsed;
    }

    const data: SidenavStatusData = {
      isOpen: this.sidenav.opened(),
      mode: this.sidenav.mode(),
      isCollapsed: this.isMenuCollapsed,
    };

    if (!this.isMobile()) {
      this.store$.dispatch(sidenavUpdated(data));
    }

    this.setSidenavStatus(data);
  }

  private listenForRouteChanges(): void {
    this.router.events.pipe(
      filter((routeChange) => routeChange instanceof NavigationEnd),
    ).subscribe(() => {
      if (this.isMobile()) {
        this.sidenav?.close();
      }
      this.closeSecondaryMenu();
    });
  }
}
