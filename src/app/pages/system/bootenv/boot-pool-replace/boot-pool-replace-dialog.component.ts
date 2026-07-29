import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-boot-pool-replace-dialog',
  templateUrl: './boot-pool-replace-dialog.component.html',
  styleUrls: ['./boot-pool-replace-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    UnusedDiskSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    FakeProgressBarComponent,
    TranslateModule,
  ],
})
export class BootPoolReplaceDialog implements OnInit {
  pk = inject(DIALOG_DATA);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  protected dialogRef = inject<DialogRef<unknown, BootPoolReplaceDialog>>(DialogRef);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  unusedDisks: DetailsDisk[] = [];
  protected isFormLoading = false;
  protected helptextSystemBootenv = helptextSystemBootenv;

  form = this.fb.nonNullable.group({
    dev: ['', Validators.required],
  });

  protected readonly Role = Role;

  ngOnInit(): void {
    this.setupWarningForExportedPools();
  }

  setupWarningForExportedPools(): void {
    this.form.controls.dev.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
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
    const oldDisk = this.pk;
    const { dev: newDisk } = this.form.getRawValue();

    this.isFormLoading = true;
    this.dialogService.jobDialog(
      this.api.job('boot.replace', [oldDisk, newDisk]),
      { title: this.translate.instant('Replacing Boot Pool Disk') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.isFormLoading = false;
        this.dialogRef.close(true);
        this.snackbar.success(this.translate.instant('Boot Pool Disk Replaced'));
      });
  }
}
