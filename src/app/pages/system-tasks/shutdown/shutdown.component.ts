import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    IxIconComponent,
    CopyrightLineComponent,
    TranslateModule,
  ],
})
export class ShutdownComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private wsManager: WebSocketConnectionService,
    private errorHandler: ErrorHandlerService,
    protected router: Router,
    private route: ActivatedRoute,
    protected dialogService: DialogService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');

    // Replace URL so that we don't shutdown again if page is refreshed.
    this.location.replaceState('/signin');

    this.ws.job('system.shutdown', [reason]).pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on shutdown
        this.dialogService.error(this.errorHandler.parseError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/signin']);
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
