import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/topbar';
import { TrueCommandConnectionState } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-true-command-status',
  templateUrl: './true-command-status.component.html',
  styleUrls: ['./true-command-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrueCommandStatusComponent implements OnInit {
  connectionState: TrueCommandConnectionState;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
  ) { }

  ngOnInit(): void {
    this.checkTruecommandState();
  }

  goToTrueCommand(): void {
    this.dialogService.generalDialog({
      title: helptext.tcDialog.title,
      message: helptext.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptext.tcDialog.confirmBtnMsg,
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.window.open(this.connectionState.truecommand_url);
      });
  }

  private checkTruecommandState(): void {
    this.ws.call('truecommand.connected')
      .pipe(untilDestroyed(this))
      .subscribe((connectionState) => {
        this.connectionState = connectionState;
        this.cdr.markForCheck();
      });
  }
}
