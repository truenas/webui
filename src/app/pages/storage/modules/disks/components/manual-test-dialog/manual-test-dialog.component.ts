import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, Inject,
  signal,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  combineLatest,
  EMPTY,
  map, Observable, of, takeWhile,
  tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { Role } from 'app/enums/role.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { SmartTestProgressUpdate } from 'app/interfaces/smart-test-progress.interface';
import { ManualSmartTest } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ManualTestDialogParams {
  selectedDisks: Disk[];
  diskIdsWithSmart: string[];
}

interface TestProgress {
  diskName: string;
  logs: string;
  error: string;
  wsError: unknown;
  progressPercentage: number;
  finished: boolean;
  esimatedEnd: ApiTimestamp;
}

@UntilDestroy()
@Component({
  selector: 'ix-manual-test-dialog',
  templateUrl: './manual-test-dialog.component.html',
  styleUrls: ['./manual-test-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualTestDialogComponent {
  form = this.formBuilder.group({
    type: [SmartTestType.Long],
  });

  testProgress = signal<TestProgress[]>([]);

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

  selectedDisksWithSmartSupport: Disk[] = [];
  selectedDisksWithoutSmartSupport: Disk[] = [];
  endedTests = false;
  progressTotalPercent = 0;

  hasStartedTests = computed<boolean>(() => {
    const startedTests = this.testProgress();
    return !!startedTests.length;
  });

  protected readonly Role = Role;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) private params: ManualTestDialogParams,
    public dialogRef: MatDialogRef<ManualTestDialogComponent>,
  ) {
    this.setDisksBySupport();
  }

  onSubmit(): void {
    const params = this.selectedDisksWithSmartSupport.map((disk) => ({
      identifier: disk.identifier,
      type: this.form.value.type,
    }));

    this.ws.call('smart.test.manual_test', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (startedTests) => {
          const disksWithTestsStarted: ManualSmartTest[] = [];
          for (const test of startedTests) {
            this.testProgress.set(this.testProgress().concat({
              diskName: test.disk,
              logs: null,
              error: test.error || null,
              wsError: null,
              finished: !!test.error,
              progressPercentage: null,
              esimatedEnd: test.expected_result_time,
            }));
            if (!test.error) {
              disksWithTestsStarted.push(test);
            }
          }

          const testProgressUpdaters$: Observable<SmartTestProgressUpdate>[] = [];
          for (const disk of disksWithTestsStarted) {
            testProgressUpdaters$.push(this.getTestUpdateSubscriber(disk.disk));
          }

          combineLatest(testProgressUpdaters$).pipe(
            untilDestroyed(this),
          ).subscribe();

          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogRef.close();
          this.dialogService.error(this.errorHandler.parseError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private setDisksBySupport(): void {
    this.params.selectedDisks.forEach((disk) => {
      const isSmartSupported = this.params.diskIdsWithSmart.includes(disk.identifier);
      if (isSmartSupported) {
        this.selectedDisksWithSmartSupport.push(disk);
      } else {
        this.selectedDisksWithoutSmartSupport.push(disk);
      }
    });
  }

  protected getTestProgress(diskName: string): number {
    const runningTests = this.testProgress();
    return runningTests.find((test) => test.diskName === diskName).progressPercentage;
  }

  protected showLogs(diskName: string): void {
    const test = this.testProgress().find((disk) => disk.diskName === diskName);
    if (test.wsError) {
      this.dialogService.error(this.errorHandler.parseError(test.wsError));
      return;
    }
    this.dialogService.info(
      this.translate.instant(`${this.form.value.type} S.M.A.R.T. Test Logs: ${diskName}`),
      test.error ? test.error : test.logs,
      true,
    );
  }

  private getTestUpdateSubscriber(diskName: string): Observable<SmartTestProgressUpdate> {
    return this.ws.subscribe(`smart.test.progress:${diskName}`).pipe(
      catchError((error: unknown) => {
        this.testProgress.set(this.testProgress().map((test) => {
          if (test.diskName === diskName) {
            test.wsError = error;
          }
          return test;
        }));
        return EMPTY;
      }),
      takeWhile((result) => {
        const isNoSubMsg = result && result.msg === IncomingApiMessageType.NoSub;
        const testProgress = this.testProgress().find((test) => test.diskName === diskName).progressPercentage;
        let isProgressing = true;
        if (result.fields.progress != null) {
          if (testProgress == null) {
            isProgressing = true;
          } else if (testProgress < result.fields.progress) {
            isProgressing = true;
          } else {
            isProgressing = false;
          }
        } else {
          isProgressing = false;
        }
        if (isNoSubMsg || !isProgressing) {
          this.testProgress.set(this.testProgress().map((test) => {
            if (test.diskName === diskName) {
              test.finished = true;
            }
            return test;
          }));
        }
        return !isNoSubMsg && isProgressing;
      }),
      map((apiEvent) => apiEvent.fields),
      tap((progressUpdate) => {
        if (progressUpdate?.progress == null) {
          return;
        }
        this.testProgress.set(this.testProgress().map((test) => {
          if (test.diskName === diskName) {
            test.progressPercentage = progressUpdate.progress;
          }
          return test;
        }));
      }),
    );
  }

  protected isTestDone(diskName: string): boolean {
    return this.testProgress().some((testProgress) => testProgress.diskName === diskName && testProgress.finished);
  }

  protected hasLogs(diskName: string): boolean {
    return this.testProgress().some((testProgress) => testProgress.diskName === diskName && !!testProgress.logs);
  }

  protected hasErrorTest(diskName: string): boolean {
    return this.testProgress().some((testProgress) => {
      if (testProgress.diskName !== diskName) {
        return false;
      }
      return testProgress.error != null || testProgress.wsError != null;
    });
  }
}
