import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, tap } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/services/auth/auth.service';
import { DetectBrowserService } from 'app/services/detect-browser.service';
import { LayoutService } from 'app/services/layout.service';
import { PingService } from 'app/services/websocket/ping.service';

@UntilDestroy()
@Component({
  selector: 'ix-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  constructor(
    public title: Title,
    private router: Router,
    private authService: AuthService,
    private detectBrowser: DetectBrowserService,
    private layoutService: LayoutService,
    private pingService: PingService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.authService.isAuthenticated$.pipe(untilDestroyed(this)).subscribe((isAuthenticated) => {
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
        const navigation = this.router.getCurrentNavigation();
        if (this.isAuthenticated && event.url !== '/signin' && !navigation?.extras?.skipLocationChange) {
          this.window.sessionStorage.setItem('redirectUrl', event.url);
        }
      }
    });
    this.pingService.setupPing();
  }

  ngOnInit(): void {
    this.setupScrollToTopOnNavigation();
  }

  private setFavicon(isDarkMode: boolean): void {
    let path = 'assets/images/truenas_scale_favicon.png';
    if (isDarkMode) {
      path = 'assets/images/truenas_scale_ondark_favicon.png';
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
