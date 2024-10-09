import {
  ChangeDetectionStrategy, Component, effect, input, OnInit, signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError, EMPTY, map, Observable, Subscription, takeWhile, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { SmartTestProgressUi } from 'app/interfaces/smart-test-progress-ui.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-test-progress-row',
  templateUrl: './test-progress-row.component.html',
  styleUrl: './test-progress-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxTestProgressRowComponent implements OnInit {
  diskName = input.required<string>();
  diskIdentifier = input.required<string>();
  diskSerial = input.required<string>();
  testType = input.required<SmartTestType>();
  loading = input.required<boolean>();
  testStartError = input.required<string>();
  testStarted = input.required<boolean>();

  testSubscription: Subscription;

  readonly subscribeTestEffect = effect(() => {
    const testStarted = this.testStarted();
    if (testStarted) {
      this.subscribeToTest();
    }
  });

  test = signal<SmartTestProgressUi>(undefined);

  constructor(
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.test.set({
      diskName: this.diskName(),
      type: this.testType(),
      diskIdentifier: this.diskIdentifier(),
      wsError: null,
      finished: false,
      progressPercentage: null,
      esimatedEnd: null,
    });
  }

  private subscribeToTest(): void {
    if (this.testSubscription) {
      return;
    }
    this.testSubscription = this.getTestUpdateSubscriber().pipe(
      catchError((error: unknown) => {
        this.test.set({
          ...this.test(),
          wsError: error,
        });
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  protected showLogs(): void {
    const test = this.test();
    if (test.wsError) {
      this.dialogService.error(this.errorHandler.parseError(test.wsError));
      return;
    }
    this.dialogService.info(
      this.translate.instant(`${test.type} S.M.A.R.T. Test Logs: ${test.diskName}`),
      this.testStartError(),
      true,
    );
  }

  private getTestUpdateSubscriber(): Observable<SmartTestProgressUpdate> {
    const diskName = this.diskName();
    return this.ws.subscribe(`smart.test.progress:${diskName}`).pipe(
      catchError((error: unknown) => {
        this.test.set({
          ...this.test(),
          wsError: error,
        });
        return EMPTY;
      }),
      takeWhile((result) => {
        const isNoSubMsg = result && result.msg === IncomingApiMessageType.NoSub;
        const testProgress = this.test().progressPercentage;
        let isProgressing = true;
        if (result.fields.progress == null) {
          isProgressing = false;
        } else if (testProgress == null) {
          isProgressing = true;
        } else if (testProgress < result.fields.progress) {
          isProgressing = true;
        } else {
          isProgressing = false;
        }
        if (isNoSubMsg || !isProgressing) {
          this.test.set({
            ...this.test(),
            finished: true,
          });
        }
        return !isNoSubMsg && isProgressing;
      }),
      map((apiEvent) => apiEvent.fields),
      tap((progressUpdate) => {
        if (progressUpdate?.progress == null) {
          return;
        }
        this.test.set({
          ...this.test(),
          progressPercentage: progressUpdate.progress,
        });
      }),
    );
  }
}
