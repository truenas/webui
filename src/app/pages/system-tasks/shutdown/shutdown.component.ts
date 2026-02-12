import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    TnIconComponent,
    CopyrightLineComponent,
    TranslateModule,
  ],
})
export class ShutdownComponent implements OnInit {
  protected api = inject(ApiService);
  private wsManager = inject(WebSocketHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);


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
    // fade to black after 60 sec on shut down
    setTimeout(() => {
      const overlay = document.getElementById('overlay');
      overlay?.setAttribute('class', 'blackout');
    }, 60000);
  }
}
