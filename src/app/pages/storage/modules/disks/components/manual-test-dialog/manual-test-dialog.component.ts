import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, of, takeWhile,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { IncomingWebsocketMessage } from 'app/interfaces/api-message.interface';
import { ManualSmartTest } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ManualTestDialogParams {
  selectedDisks: Disk[];
  diskIdsWithSmart: string[];
}

@UntilDestroy()
@Component({
  templateUrl: './manual-test-dialog.component.html',
  styleUrls: ['./manual-test-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualTestDialogComponent {
  form = this.formBuilder.group({
    type: [SmartTestType.Long],
  });

  testTypes$ = of([
    {
      label: this.translate.instant('LONG'),
      value: SmartTestType.Long,
    },
    {
      label: this.translate.instant('SHORT'),
      value: SmartTestType.Short,
    },
    {
      label: this.translate.instant('CONVEYANCE'),
      value: SmartTestType.Conveyance,
    },
    {
      label: this.translate.instant('OFFLINE'),
      value: SmartTestType.Offline,
    },
  ]);

  supportedDisks: Disk[] = [];
  unsupportedDisks: Disk[] = [];
  startedTests: ManualSmartTest[] = [];
  endedTests = false;
  progressTotalPercent = 0;

  get hasStartedTests(): boolean {
    return Boolean(this.startedTests.length);
  }

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private params: ManualTestDialogParams,
  ) {
    this.setDisksBySupport();
  }

  onSubmit(): void {
    const params = this.supportedDisks.map((disk) => ({
      identifier: disk.identifier,
      type: this.form.value.type,
    }));

    this.ws.call('smart.test.manual_test', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (startedTests) => {
          this.startedTests = startedTests;
          this.ws.subscribe('smart.test.progress').pipe(
            map((event) => event.fields),
            takeWhile((result) => {
              const condition = result
                && (result as unknown as IncomingWebsocketMessage).msg === IncomingApiMessageType.NoSub;
              this.endedTests = condition;
              return !condition;
            }),
            untilDestroyed(this),
          ).subscribe({
            next: (result) => {
              if (result?.progress) {
                this.progressTotalPercent = result.progress.percent / 100;
              }
              this.cdr.markForCheck();
            },
            complete: () => {
              this.cdr.markForCheck();
            },
          });

          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private setDisksBySupport(): void {
    this.params.selectedDisks.forEach((disk) => {
      const isSmartSupported = this.params.diskIdsWithSmart.includes(disk.identifier);
      if (isSmartSupported) {
        this.supportedDisks.push(disk);
      } else {
        this.unsupportedDisks.push(disk);
      }
    });
  }
}
