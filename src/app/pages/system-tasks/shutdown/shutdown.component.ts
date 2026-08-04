import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { timer } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { SystemTaskSplashComponent } from 'app/pages/system-tasks/system-task-splash/system-task-splash.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/** How long the splash stays readable before the screen fades to black. */
export const blackoutDelay = 60 * 1000;

@Component({
  selector: 'ix-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SystemTaskSplashComponent,
    TranslateModule,
  ],
})
export class ShutdownComponent implements OnInit {
  private api = inject(ApiService);
  private wsManager = inject(WebSocketHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected readonly isBlackedOut = signal(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason') || 'Unknown Reason';

    // Replace URL so that we don't shutdown again if page is refreshed.
    this.location.replaceState('/signin');

    this.api.job('system.shutdown', [reason]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => { // error on shutdown
        this.errorHandler.showErrorModal(error)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.router.navigate(['/signin']);
          });
      },
      complete: () => {
        this.wsManager.prepareShutdown();
        this.authService.clearAuthToken();
      },
    });
    // The system is off by now, so fade the screen to black.
    timer(blackoutDelay)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.isBlackedOut.set(true));
  }
}
