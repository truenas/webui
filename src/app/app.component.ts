import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { filter, tap } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LayoutService } from 'app/modules/layout/layout.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { PingService } from 'app/modules/websocket/ping.service';
import { WebSocketDebugPanelComponent } from 'app/modules/websocket-debug-panel/websocket-debug-panel.component';
import { DetectBrowserService } from 'app/services/detect-browser.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Component({
  selector: 'ix-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, WebSocketDebugPanelComponent],
})
export class AppComponent implements OnInit {
  title = inject(Title);
  private router = inject(Router);
  private wsStatus = inject(WebSocketStatusService);
  private detectBrowser = inject(DetectBrowserService);
  private layoutService = inject(LayoutService);
  private authService = inject(AuthService);
  private dialog = inject(DialogService);
  private snackbar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);
  private slideIn = inject(SlideIn);
  private pingService = inject(PingService);

  isAuthenticated = false;
  debugPanelEnabled = environment.debugPanel?.enabled || false;

  constructor() {
    const window = this.window;

    // Ensure PingService is instantiated so it can listen for WebSocket connections
    // and automatically set up ping when connection is established
    this.pingService.initializePingService();
    this.wsStatus.isAuthenticated$.pipe(untilDestroyed(this)).subscribe((isAuthenticated) => {
      if (!isAuthenticated && this.isAuthenticated) {
        this.logOutExpiredUser();
        return;
      }

      this.isAuthenticated = isAuthenticated;
    });
    this.title.setTitle('TrueNAS - ' + this.window.location.hostname);

    this.setFavicon(this.window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (this.detectBrowser.matchesBrowser('Safari')) {
      document.body.className += ' safari-platform';
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.setFavicon(event.matches);
    });

    this.router.events.pipe(untilDestroyed(this)).subscribe((event) => {
      // save currenturl
      if (event instanceof NavigationEnd) {
        this.slideIn.closeAll();
        const navigation = this.router.currentNavigation();
        if (this.isAuthenticated && event.url !== '/signin' && !navigation?.extras?.skipLocationChange) {
          this.window.sessionStorage.setItem('redirectUrl', event.url);
        }
      }
    });
  }

  ngOnInit(): void {
    this.setupScrollToTopOnNavigation();
  }

  private logOutExpiredUser(): void {
    this.authService.clearAuthToken();
    this.router.navigate(['/signin']);
    this.snackbar.open(
      this.translate.instant('Session expired'),
      this.translate.instant('Close'),
      { duration: 4000, verticalPosition: 'bottom' },
    );
    this.dialog.closeAllDialogs();
  }

  private setFavicon(isDarkMode: boolean): void {
    let path = 'assets/images/truenas_favicon.png';
    if (isDarkMode) {
      path = 'assets/images/truenas_ondark_favicon.png';
    }

    const existingLinkElement = document.querySelector('link[rel=icon]');

    if (existingLinkElement) {
      (existingLinkElement as unknown as { href: string }).href = path;
    } else {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = path;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  private setupScrollToTopOnNavigation(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      tap(() => this.layoutService.getContentContainer()?.scrollTo(0, 0)),
      untilDestroyed(this),
    ).subscribe();
  }
}
