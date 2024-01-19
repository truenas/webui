import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, NavigationSkipped, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, filter, take, timer,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent implements OnInit, AfterViewInit {
  isSystemLicensed$: Observable<boolean> = this.ws.call('system.security.info.fips_available');
  protected readonly Role = Role;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      this.handleFragment(this.route.snapshot.fragment);
    });
  }

  ngAfterViewInit(): void {
    this.handleFragment(this.route.snapshot.fragment);
  }

  private handleFragment(fragment: string): void {
    if (fragment === 'access') {
      const sessionsContainer = this.document.getElementById('access-card');
      if (sessionsContainer) {
        this.handleHashScrollIntoView(sessionsContainer);
      }
    }
  }

  private handleHashScrollIntoView(container: HTMLElement): void {
    const highlightedClass = 'highlighted-card';

    container?.scrollIntoView({ block: 'center' });
    container.classList.add(highlightedClass);
    timer(2000).pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe(() => container.classList.remove(highlightedClass));
  }
}
