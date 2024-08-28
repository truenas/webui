import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-boot-pool-attach-dialog',
  templateUrl: './boot-pool-attach-dialog.component.html',
  styleUrls: ['./boot-pool-attach-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolAttachDialogComponent implements OnInit {
  isFormLoading = false;
  protected helptextSystemBootenv = helptextSystemBootenv;

  form = this.fb.group({
    dev: ['', Validators.required],
    expand: [false],
  });

  unusedDisks: DetailsDisk[] = [];

  expand = {
    fcName: 'expand',
    label: this.translate.instant(helptextSystemBootenv.expand_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.expand_tooltip),
  };

  protected readonly Role = Role;

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<BootPoolAttachDialogComponent>,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.setupWarningForExportedPools();
  }

  setupWarningForExportedPools(): void {
    this.form.controls.dev.valueChanges.pipe(untilDestroyed(this)).subscribe(
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
    this.dialogService.jobDialog(
      this.ws.job('boot.attach', [dev, { expand }]),
      { title: this.translate.instant('Attaching Disk to Boot Pool') },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.snackbar.success(this.translate.instant('Device «{name}» was successfully attached.', { name: dev }));
          this.dialogRef.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
