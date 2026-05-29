import { DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { isObject } from 'lodash-es';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { StatusBadge, StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';
import { LoaderService } from 'app/modules/loader/loader.service';
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
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const truecommandStatusLabels: Record<TrueCommandStatus, string> = {
  [TrueCommandStatus.Disabled]: T('TrueCommand is disabled'),
  [TrueCommandStatus.Connecting]: T('Connecting to TrueCommand'),
  [TrueCommandStatus.Connected]: T('TrueCommand is connected'),
  [TrueCommandStatus.Failed]: T('TrueCommand connection failed'),
};

@Component({
  selector: 'ix-truecommand-button',
  templateUrl: './truecommand-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    NgClass,
    NgTemplateOutlet,
    StatusBadgeComponent,
    UiSearchDirective,
  ],
})
export class TruecommandButtonComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private overlay = inject(Overlay);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  readonly TrueCommandStatus = TrueCommandStatus;
  protected searchableElements = trueCommandElements;

  protected tcStatus = signal<TrueCommandConfig | null>(null);
  private tcConnected = false;
  private isTcStatusOpened = false;
  private tcStatusDialogRef: DialogRef<boolean, TruecommandStatusModalComponent> | undefined;

  protected statusBadge = computed<StatusBadge | null>(() => {
    switch (this.tcStatus()?.status) {
      case TrueCommandStatus.Connected:
        return { icon: 'check', background: 'var(--green)' };
      case TrueCommandStatus.Failed:
        return { icon: 'close', background: 'var(--red)' };
      case TrueCommandStatus.Connecting:
        return { icon: 'clock-outline', background: 'var(--yellow)', spinning: true };
      default:
        return null;
    }
  });

  protected tooltip = computed(() => {
    const config = this.tcStatus();
    if (!config) {
      return this.translate.instant(helptextTopbar.tooltips.truecommandStatus);
    }
    const label = this.translate.instant(truecommandStatusLabels[config.status]);
    if (config.status === TrueCommandStatus.Failed && config.status_reason) {
      return `${label}\n${this.translate.instant(config.status_reason)}`;
    }
    return label;
  });

  ngOnInit(): void {
    this.api.call('truecommand.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.tcStatus.set(config);
      this.tcConnected = !!config.api_key;
    });
    this.api.subscribe('truecommand.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.tcStatus.set(event.fields);
      this.tcConnected = !!event.fields.api_key;
      if (this.isTcStatusOpened && this.tcStatusDialogRef) {
        this.tcStatusDialogRef.componentInstance?.update(event.fields);
      }
    });
  }

  handleUpdate(): void {
    this.tnDialog
      .open(TruecommandConnectModalComponent, {
        maxWidth: '420px',
        minWidth: '350px',
        data: {
          isConnected: this.tcConnected,
          config: this.tcStatus(),
        } as TruecommandSignupModalState,
      })
      .closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dialogResult: TruecommandSignupModalResult) => {
        if (isObject(dialogResult) && dialogResult?.deregistered) {
          // The status dialog is only open when the update flow was launched from it.
          // Reached via the signup flow it is undefined, so guard the close.
          this.tcStatusDialogRef?.close(true);
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
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (confirmed) {
        this.loader.open();
        this.api.call('truecommand.update', [{ enabled: false }]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.loader.close();
          },
          error: (error: unknown) => {
            this.loader.close();
            this.errorHandler.showErrorModal(error);
          },
        });
      }
    });
  }

  private openSignupDialog(): void {
    this.tnDialog.open(TruecommandSignupModalComponent)
      .closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shouldConnect) => {
        if (!shouldConnect) {
          return;
        }

        this.handleUpdate();
      });
  }

  private openStatusDialog(): void {
    if (this.isTcStatusOpened) {
      this.tcStatusDialogRef?.close(true);
      return;
    }

    this.isTcStatusOpened = true;
    this.tcStatusDialogRef = this.tnDialog.open(TruecommandStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().top('48px').right('0px'),
      data: {
        parent: this,
        data: this.tcStatus(),
      },
    });

    // Clear our reference once the dialog is gone so a stale ref isn't carried
    // into the next open and we don't try to call .update on a destroyed component.
    this.tcStatusDialogRef.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isTcStatusOpened = false;
      this.tcStatusDialogRef = undefined;
    });
  }
}
