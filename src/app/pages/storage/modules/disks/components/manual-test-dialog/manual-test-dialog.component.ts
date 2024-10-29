import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SmartTestType } from 'app/enums/smart-test-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TestProgressRowComponent } from 'app/pages/storage/modules/disks/components/manual-test-dialog/test-progress-row/test-progress-row.component';
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
    TestProgressRowComponent,
  ],
})
export class ManualTestDialogComponent {
  form = this.formBuilder.group({
    type: [SmartTestType.Long],
  });

  isSubmitted = signal<boolean>(false);
  startedTests = signal<boolean>(false);

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

  selectedDisksWithSmartSupport: (Disk & { error: string })[] = [];
  selectedDisksWithoutSmartSupport: Disk[] = [];

  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) private params: ManualTestDialogParams,
    public dialogRef: MatDialogRef<ManualTestDialogComponent>,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {
    this.setDisksBySupport();
  }

  onSubmit(): void {
    this.isSubmitted.set(true);
    const params = this.selectedDisksWithSmartSupport.map((disk) => ({
      identifier: disk.identifier,
      type: this.form.value.type,
    }));

    this.ws.call('smart.test.manual_test', [params])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (startedTests) => {
          const disksWithErrors = startedTests.filter(
            (test) => test.error,
          ).map(
            (test) => ({ disk: test.disk, error: test.error }),
          );
          this.selectedDisksWithSmartSupport = this.selectedDisksWithSmartSupport.map((disk) => {
            disk.error = disksWithErrors.find((errorDisk) => errorDisk.disk === disk.name)?.error;
            return disk;
          });
          this.cdr.markForCheck();
          this.startedTests.set(true);
        },
      });
  }

  private setDisksBySupport(): void {
    this.params.selectedDisks.forEach((disk) => {
      const isSmartSupported = this.params.diskIdsWithSmart.includes(disk.identifier);
      if (isSmartSupported) {
        this.selectedDisksWithSmartSupport.push({ ...disk, error: null });
      } else {
        this.selectedDisksWithoutSmartSupport.push(disk);
      }
    });
  }
}
