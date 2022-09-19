import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.scss'],
})
export class ShutdownComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected dialogService: DialogService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    // Replace URL so that we don't shutdown again if page is refreshed.
    this.location.replaceState('/session/signin');

    this.ws.call('system.shutdown', {}).pipe(untilDestroyed(this)).subscribe({
      error: (error) => { // error on shutdown
        this.dialogService.errorReport(error.error, error.reason, error.trace.formatted)
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/session/signin']);
          });
      },
      complete: () => {
        this.ws.prepareShutdown();
      },
    });
    // fade to black after 60 sec on shut down
    setTimeout(() => {
      const overlay = document.getElementById('overlay');
      overlay.setAttribute('class', 'blackout');
    }, 60000);
  }
}
