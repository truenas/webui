import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShutdownComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private wsManager: WebSocketConnectionService,
    private errorHandler: ErrorHandlerService,
    protected router: Router,
    protected dialogService: DialogService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    // Replace URL so that we don't shutdown again if page is refreshed.
    this.location.replaceState('/sessions/signin');

    this.ws.job('system.shutdown', {}).pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on shutdown
        this.dialogService.error(this.errorHandler.parseError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/sessions/signin']);
          });
      },
      complete: () => {
        this.wsManager.prepareShutdown();
      },
    });
    // fade to black after 60 sec on shut down
    setTimeout(() => {
      const overlay = document.getElementById('overlay');
      overlay.setAttribute('class', 'blackout');
    }, 60000);
  }
}
