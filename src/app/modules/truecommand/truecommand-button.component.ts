import {
  Component, OnDestroy, OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import helptext from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { TruecommandSignupModalComponent, TruecommandSignupModalState } from 'app/modules/truecommand/components/truecommand-signup-modal.component';
import { TruecommandStatusModalComponent } from 'app/modules/truecommand/components/truecommand-status-modal.component';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'truecommand-button',
  styleUrls: ['./truecommand-button.component.scss'],
  templateUrl: './truecommand-button.component.html',
})
export class TruecommandButtonComponent extends ViewControllerComponent implements OnInit, OnDestroy {
  readonly TrueCommandStatus = TrueCommandStatus;
  mat_tooltips = helptext.mat_tooltips;

  tcStatus: TrueCommandConfig;

  private tcConnected = false;
  private isTcStatusOpened = false;
  private tcStatusDialogRef: MatDialogRef<TruecommandStatusModalComponent>;

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private dialog: MatDialog,
    private loader: AppLoaderService,
    core: CoreService,
  ) {
    super(core);
  }

  ngOnInit(): void {
    this.ws.call('truecommand.config').pipe(untilDestroyed(this)).subscribe((config) => {
      this.tcStatus = config;
      this.tcConnected = !!config.api_key;
    });
    this.ws.subscribe('truecommand.config').pipe(untilDestroyed(this)).subscribe((event) => {
      this.tcStatus = event.fields;
      this.tcConnected = !!event.fields.api_key;
      if (this.isTcStatusOpened && this.tcStatusDialogRef) {
        this.tcStatusDialogRef.componentInstance.update(this.tcStatus);
      }
    });
  }

  handleUpdate(): void {
    this.dialog
      .open(TruecommandSignupModalComponent, {
        maxWidth: '420px',
        minWidth: '350px',
        data: {
          isConnected: this.tcConnected,
          config: this.tcStatus,
        } as TruecommandSignupModalState,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((dialogResult) => {
        if (dialogResult?.deregistered) {
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
      title: helptext.stopTCConnectingDialog.title,
      icon: helptext.stopTCConnectingDialog.icon,
      message: helptext.stopTCConnectingDialog.message,
      confirmBtnMsg: helptext.stopTCConnectingDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.ws.call('truecommand.update', [{ enabled: false }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.loader.close();
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWsError(this, err, this.dialogService);
          },
        );
      }
    });
  }

  private openSignupDialog(): void {
    const conf: DialogFormConfiguration = {
      title: helptext.signupDialog.title,
      message: helptext.signupDialog.content,
      fieldConfig: [],
      saveButtonText: helptext.signupDialog.connect_btn,
      custActions: [
        {
          id: 'signup',
          name: helptext.signupDialog.singup_btn,
          function: () => {
            window.open('https://portal.ixsystems.com');
            this.dialogService.closeAllDialogs();
          },
        },
      ],
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();
        this.handleUpdate();
      },
    };
    this.dialogService.dialogForm(conf);
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
      this.tcStatusDialogRef = this.dialog.open(TruecommandStatusModalComponent, {
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
      },
    );
  }
}
