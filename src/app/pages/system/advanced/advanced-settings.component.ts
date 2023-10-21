import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, take, timer } from 'rxjs';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSettingsComponent implements AfterViewInit {
  isSystemLicensed$: Observable<null | object> = this.ws.call('system.license');

  constructor(private route: ActivatedRoute, private ws: WebSocketService) {}

  ngAfterViewInit(): void {
    this.route.fragment.pipe(untilDestroyed(this)).subscribe((fragment: string) => {
      const sessionsContainer = document.getElementById('sessions-card');

      if (fragment === 'sessions' && sessionsContainer) {
        this.handleHashScrollIntoView(sessionsContainer);
      }
    });
  }

  private handleHashScrollIntoView(container: HTMLElement): void {
    const highlightedClass = 'highlighted-card';

    container?.scrollIntoView({ block: 'center' });
    container.classList.add(highlightedClass);
    timer(2000).pipe(take(1), untilDestroyed(this)).subscribe(() => container.classList.remove(highlightedClass));
  }
}
