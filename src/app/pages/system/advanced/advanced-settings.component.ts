import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, NavigationSkipped, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, filter, switchMap, take, timer,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent implements OnInit {
  isSystemLicensed$: Observable<boolean> = this.ws.call('system.security.info.fips_available');
  protected readonly Role = Role;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.handleFragment(this.route.snapshot.fragment);

    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd || event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      this.handleFragment(this.route.snapshot.fragment);
    });
  }

  private handleFragment(fragment: string): void {
    if (fragment === 'access') {
      const sessionsContainer = document.getElementById('access-card');
      if (sessionsContainer) {
        this.handleHashScrollIntoView(sessionsContainer);
      }
    }
  }

  private handleHashScrollIntoView(container: HTMLElement): void {
    const highlightedClass = 'highlighted-card';

    timer(100).pipe(
      take(1),
      switchMap(() => {
        container?.scrollIntoView({ block: 'center' });
        container.classList.add(highlightedClass);
        return timer(2000);
      }),
      untilDestroyed(this),
    ).subscribe(() => container.classList.remove(highlightedClass));
  }

  viewSessionsCard(): void {
    this.router.navigate(['/system', 'advanced'], { fragment: 'access' });
  }
}
