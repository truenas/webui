import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-replace-dialog.component.html',
  styleUrls: ['./boot-pool-replace-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceDialogComponent implements OnInit {
  isFormLoading = false;
  unusedDisks: UnusedDisk[] = [];

  form = this.fb.group({
    dev: ['', Validators.required],
  });

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.replace_name_placeholder),
    options: this.ws.call('disk.get_unused').pipe(
      map((unusedDisks) => {
        this.unusedDisks = unusedDisks;
        const options = unusedDisks.map((disk) => ({
          label: disk.name + (disk.exported_zpool ? ' (' + disk.exported_zpool + ')' : ''),
          value: disk.name,
        }));

        return [
          ...options,
        ];
      }),
    ),
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public pk: string,
    private fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private dialogRef: MatDialogRef<BootPoolReplaceDialogComponent>,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.setupWarningForExportedPools();
  }

  setupWarningForExportedPools(): void {
    this.form.get(this.dev.fcName).valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnForExportedPools.bind(this),
    );
  }

  warnForExportedPools(disk: string): void {
    const unusedDisk = this.unusedDisks.find((unusedDisk) => unusedDisk.name === disk);
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

    const payload = this.pk;
    const { dev } = this.form.value;
    this.ws.call('boot.replace', [payload, dev]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
