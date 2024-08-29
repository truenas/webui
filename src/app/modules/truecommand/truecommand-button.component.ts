import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Inject, OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash-es';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  TruecommandConnectModalComponent,
  TruecommandSignupModalResult,
  TruecommandSignupModalState,
} from 'app/modules/truecommand/components/truecommand-connect-modal/truecommand-connect-modal.component';
import {
  TruecommandSignupModalComponent,
} from 'app/modules/truecommand/components/truecommand-signup-modal/truecommand-signup-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal/truecommand-status-modal.component';
import { trueCommandElements } from 'app/modules/truecommand/truecommand-button.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-truecommand-button',
  styleUrls: ['./truecommand-button.component.scss'],
  templateUrl: './truecommand-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruecommandButtonComponent implements OnInit {
  readonly TrueCommandStatus = TrueCommandStatus;
  tooltips = helptextTopbar.mat_tooltips;
  protected searchableElements = trueCommandElements;

  tcStatus: TrueCommandConfig;

  private tcConnected = false;
  private isTcStatusOpened = false;
  private tcStatusDialogRef: MatDialogRef<TruecommandStatusModalComponent>;

  get tcsStatusMatBadge(): string {
    if (this.tcStatus.status === TrueCommandStatus.Connected) {
      return 'check';
    }

    if (this.tcStatus.status === TrueCommandStatus.Failed) {
      return 'priority_high';
    }

    return '';
  }

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.ws.call('truecommand.config').pipe(untilDestroyed(this)).subscribe((config) => {
      this.tcStatus = config;
      this.tcConnected = !!config.api_key;
      this.cdr.markForCheck();
    });
    this.ws.subscribe('truecommand.config').pipe(untilDestroyed(this)).subscribe((event) => {
      this.tcStatus = event.fields;
      this.tcConnected = !!event.fields.api_key;
      if (this.isTcStatusOpened && this.tcStatusDialogRef) {
        this.tcStatusDialogRef.componentInstance.update(this.tcStatus);
      }
      this.cdr.markForCheck();
    });
  }

  handleUpdate(): void {
    this.matDialog
      .open(TruecommandConnectModalComponent, {
        maxWidth: '420px',
        minWidth: '350px',
        data: {
          isConnected: this.tcConnected,
          config: this.tcStatus,
        } as TruecommandSignupModalState,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((dialogResult: TruecommandSignupModalResult) => {
        if (_.isObject(dialogResult) && dialogResult?.deregistered) {
          this.tcStatusDialogRef.close(true);
        }
      });
  }

  handleClick(): void {
    if (this.tcConnected) {
      this.openStatusDialog();
    } else {
      this.openSignupDialog();
    }
  }

  stopTrueCommandConnecting(): void {
    this.dialogService.generalDialog({
      title: helptextTopbar.stopTCConnectingDialog.title,
      icon: helptextTopbar.stopTCConnectingDialog.icon,
      message: helptextTopbar.stopTCConnectingDialog.message,
      confirmBtnMsg: helptextTopbar.stopTCConnectingDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (confirmed) {
        this.loader.open();
        this.ws.call('truecommand.update', [{ enabled: false }]).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.loader.close();
          },
          error: (err: unknown) => {
            this.loader.close();
            this.dialogService.error(this.errorHandler.parseError(err));
          },
        });
      }
    });
  }

  private openSignupDialog(): void {
    this.matDialog.open(TruecommandSignupModalComponent)
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((shouldConnect) => {
        if (!shouldConnect) {
          return;
        }

        this.handleUpdate();
      });
  }

  private openStatusDialog(): void {
    const data = {
      parent: this,
      data: this.tcStatus,
    };
    if (this.isTcStatusOpened) {
      this.tcStatusDialogRef.close(true);
    } else {
      this.isTcStatusOpened = true;
      this.tcStatusDialogRef = this.matDialog.open(TruecommandStatusModalComponent, {
        width: '400px',
        hasBackdrop: true,
        position: {
          top: '48px',
          right: '0px',
        },
        data,
      });
    }

    this.tcStatusDialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isTcStatusOpened = false;
        this.cdr.markForCheck();
      },
    );
  }
}
