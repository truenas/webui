import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-boot-pool-replace-dialog',
  templateUrl: './boot-pool-replace-dialog.component.html',
  styleUrls: ['./boot-pool-replace-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceDialogComponent implements OnInit {
  unusedDisks: DetailsDisk[] = [];

  form = this.fb.group({
    dev: ['', Validators.required],
  });
  protected readonly Role = Role;
  dev = {
    fcName: 'dev' as const,
    label: this.translate.instant(helptextSystemBootenv.replace_name_placeholder),
    options: this.ws.call('disk.get_unused').pipe(
      map((unusedDisks) => {
        this.unusedDisks = unusedDisks;
        const options = unusedDisks.map((disk) => {
          const size = buildNormalizedFileSize(disk.size);
          let label = `${disk.name} - ${size}`;
          if (disk.exported_zpool) {
            label += ` (${disk.exported_zpool})`;
          }

          return {
            label,
            value: disk.name,
          };
        });

        return [
          ...options,
        ];
      }),
    ),
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public pk: string,
    private fb: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<BootPoolReplaceDialogComponent>,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.setupWarningForExportedPools();
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
    const oldDisk = this.pk;
    const { dev: newDisk } = this.form.value;

    this.dialogService.jobDialog(
      this.ws.job('boot.replace', [oldDisk, newDisk]),
      { title: this.translate.instant('Replacing Boot Pool Disk') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
        this.snackbar.success(this.translate.instant('Boot Pool Disk Replaced'));
      });
  }
}
