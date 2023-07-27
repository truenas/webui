import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-attach-dialog.component.html',
  styleUrls: ['./boot-pool-attach-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolAttachDialogComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    dev: ['', Validators.required],
    expand: [false],
  });

  unusedDisks: UnusedDisk[] = [];

  dev = {
    fcName: 'dev' as const,
    label: this.translate.instant(helptextSystemBootenv.dev_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.dev_tooltip),
    options: of([]),
  };

  expand = {
    fcName: 'expand',
    label: this.translate.instant(helptextSystemBootenv.expand_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.expand_tooltip),
  };

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<BootPoolAttachDialogComponent>,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.loadUnusedDisks();
    this.setupWarningForExportedPools();
  }

  loadUnusedDisks(): void {
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.unusedDisks = unusedDisks;
      const unusedDisksOptions = unusedDisks.map((disk) => {
        const size = filesize(disk.size, { standard: 'iec' });
        let label = `${disk.name} - ${size}`;
        if (disk.exported_zpool) {
          label += ` (${disk.exported_zpool})`;
        }

        return {
          label,
          value: disk.name,
        };
      });
      this.dev.options = of(unusedDisksOptions);
    });
  }

  setupWarningForExportedPools(): void {
    this.form.controls[this.dev.fcName].valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnForExportedPools.bind(this),
    );
  }

  warnForExportedPools(diskName: string): void {
    const unusedDisk = this.unusedDisks.find((disk) => disk.name === diskName);
    if (!unusedDisk?.exported_zpool) {
      return;
    }
    this.dialogService.warn(
      this.translate.instant('Warning') + ': ' + unusedDisk.name,
      this.translate.instant(
        'This disk is part of the exported pool {pool}. Reusing this disk will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure any sensitive data in {pool} is backed up before reusing/repurposing this disk.',
        { pool: `'${unusedDisk.exported_zpool}'` },
      ),
    );
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const { dev, expand } = this.form.value;
    this.ws.job('boot.attach', [dev, { expand }]).pipe(untilDestroyed(this)).subscribe({
      next: (job) => {
        if (job.state !== JobState.Success) {
          return;
        }

        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialogService.info(
          helptextSystemBootenv.attach_dialog.title,
          `<i>${dev}</i> ${helptextSystemBootenv.attach_dialog.message}`,
          true,
        )
          .pipe(untilDestroyed(this)).subscribe(() => {
            this.dialogRef.close(true);
          });
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
