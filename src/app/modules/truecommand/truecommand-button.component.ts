import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { isObject } from 'lodash-es';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { StatusBadge, StatusBadgeComponent } from 'app/modules/layout/topbar/status-badge/status-badge.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
  styleUrls: ['./truecommand-button.component.scss'],
  templateUrl: './truecommand-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    TestDirective,
    MatTooltip,
    TnIconComponent,
    NgClass,
    StatusBadgeComponent,
    UiSearchDirective,
    TranslateModule,
  ],
})
export class TruecommandButtonComponent implements OnInit {
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private matDialog = inject(MatDialog);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  readonly TrueCommandStatus = TrueCommandStatus;
  protected searchableElements = trueCommandElements;

  protected tcStatus = signal<TrueCommandConfig | null>(null);
  private tcConnected = false;
  private isTcStatusOpened = false;
  private tcStatusDialogRef: MatDialogRef<TruecommandStatusModalComponent>;

  protected statusBadge = computed<StatusBadge | null>(() => {
    switch (this.tcStatus()?.status) {
      case TrueCommandStatus.Connected:
        return { icon: 'check', kind: 'success' };
      case TrueCommandStatus.Failed:
        return { icon: 'close', kind: 'error' };
      case TrueCommandStatus.Connecting:
        return { icon: 'clock-outline', kind: 'warning' };
      case TrueCommandStatus.Disabled:
        return { icon: 'pause-circle', kind: 'warning' };
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
        this.tcStatusDialogRef.componentInstance.update(event.fields);
      }
    });
  }

  handleUpdate(): void {
    this.matDialog
      .open(TruecommandConnectModalComponent, {
        maxWidth: '420px',
        minWidth: '350px',
        data: {
          isConnected: this.tcConnected,
          config: this.tcStatus(),
        } as TruecommandSignupModalState,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dialogResult: TruecommandSignupModalResult) => {
        if (isObject(dialogResult) && dialogResult?.deregistered) {
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
    this.matDialog.open(TruecommandSignupModalComponent)
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      data: this.tcStatus(),
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

    this.tcStatusDialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      () => {
        this.isTcStatusOpened = false;
      },
    );
  }
}
