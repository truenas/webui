import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { map, tap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-attach-form.component.html',
  styleUrls: ['./boot-pool-attach-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolAttachFormComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    dev: ['', Validators.required],
    expand: [false],
  });

  unusedDisks: UnusedDisk[] = [];

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.dev_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.dev_tooltip),
    options: this.ws.call('disk.get_unused').pipe(
      tap((unusedDisks) => {
        this.unusedDisks = unusedDisks;
      }),
      map((unusedDisks) => {
        return unusedDisks.map((disk) => ({
          label: (
            `${disk.name} (${filesize(disk['size'], { standard: 'iec' })})`
            + (disk.exported_zpool ? ' (' + disk.exported_zpool + ')' : '')
          ),
          value: disk.name,
        }));
      }),
    ),
  };

  expand = {
    fcName: 'expand',
    label: this.translate.instant(helptextSystemBootenv.expand_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.expand_tooltip),
  };

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    private dialogService: DialogService,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.setupWarningForExportedZpoolsForUnusedDisks();
  }

  setupWarningForExportedZpoolsForUnusedDisks(): void {
    this.form.get(this.dev.fcName).valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnForExportedZpoolsForUnusedDisksIfNeeded,
    );
  }

  warnForExportedZpoolsForUnusedDisksIfNeeded = (diskName: string): void => {
    const unusedDisk = this.findDiskFromUnusedDisks(diskName);
    if (unusedDisk?.exported_zpool) {
      this.showWarningAboutExportedPoolForDisk(unusedDisk);
    }
  };

  showWarningAboutExportedPoolForDisk(unusedDisk: Partial<UnusedDisk>): void {
    this.dialogService.warn(
      this.translate.instant('Warning'),
      this.translate.instant(
        'This disk is part of the exported zpool {zpool}. Reusing this disk will make {zpool} unable\
        to import. You will lose any and all data in {zpool}. Are you sure you want to use this disk?',
        { zpool: '\'' + unusedDisk.exported_zpool + '\'' },
      ),
    );
  }

  findDiskFromUnusedDisks(diskName: string): UnusedDisk {
    return this.unusedDisks.find((unusedDisk) => unusedDisk.name === diskName);
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const { dev, expand } = this.form.value;
    this.ws.job('boot.attach', [dev, { expand }]).pipe(untilDestroyed(this)).subscribe((job) => {
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
          this.router.navigate(['system', 'boot']);
        });
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(['system', 'boot', 'status']);
  }
}
