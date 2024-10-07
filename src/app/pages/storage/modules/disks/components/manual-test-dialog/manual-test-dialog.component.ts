import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  map, of, takeWhile,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { Role } from 'app/enums/role.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { IncomingWebSocketMessage } from 'app/interfaces/api-message.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { ManualSmartTest } from 'app/interfaces/smart-test.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ManualTestDialogParams {
  selectedDisks: Disk[];
  diskIdsWithSmart: string[];
}

@UntilDestroy()
@Component({
  selector: 'ix-manual-test-dialog',
  templateUrl: './manual-test-dialog.component.html',
  styleUrls: ['./manual-test-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    MatProgressBar,
    TranslateModule,
    FormatDateTimePipe,
    PercentPipe,
  ],
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
                && (result as unknown as IncomingWebSocketMessage).msg === IncomingApiMessageType.NoSub;
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
        this.supportedDisks.push(disk);
      } else {
        this.unsupportedDisks.push(disk);
      }
    });
  }
}
