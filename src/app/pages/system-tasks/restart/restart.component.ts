import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-restart',
  templateUrl: './restart.component.html',
  styleUrls: ['./restart.component.scss'],
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
export class RestartComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private wsManager: WebSocketConnectionService,
    protected router: Router,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog,
    private location: Location,
  ) {
  }

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');

    // Replace URL so that we don't restart again if page is refreshed.
    this.location.replaceState('/signin');

    this.matDialog.closeAll();
    this.ws.job('system.reboot', [reason]).pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on restart
        this.dialogService.error(this.errorHandler.parseError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/signin']);
          });
      },
      complete: () => { // show restart screen
        this.wsManager.prepareShutdown();
        this.wsManager.closeWebSocketConnection();
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 5000);
      },
    });
  }
}
