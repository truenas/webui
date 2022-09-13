import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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
  templateUrl: './boot-pool-replace-form.component.html',
  styleUrls: ['./boot-pool-replace-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolReplaceFormComponent implements OnInit {
  isFormLoading = false;
  routeSuccess: string[] = ['system', 'boot', 'status'];
  pk: string;
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
    private fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    private translate: TranslateService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
    });

    this.setupWarningForExportedPoolForUnusedDisks();
  }

  setupWarningForExportedPoolForUnusedDisks(): void {
    this.form.get(this.dev.fcName).valueChanges.pipe(untilDestroyed(this)).subscribe(
      this.warnExportedPoolsForUnusedDisksIfNeeded,
    );
  }

  warnExportedPoolsForUnusedDisksIfNeeded = (disk: string): void => {
    const unusedDisk = this.findDiskFromUnusedDisks(disk);
    if (unusedDisk?.exported_zpool) {
      this.showWarningAboutExportedPoolForDisk(unusedDisk);
    }
  };

  findDiskFromUnusedDisks(diskName: string): UnusedDisk {
    return this.unusedDisks.find((unusedDisk) => unusedDisk.name === diskName);
  }

  showWarningAboutExportedPoolForDisk(unusedDisk: Partial<UnusedDisk>): void {
    this.dialogService.warn(
      this.translate.instant('Warning'),
      this.translate.instant(
        'This disk is part of the exported pool {pool}. Reusing this disk will make {pool} unable to import. You will lose any and all data in {pool}. Please make sure any sensitive data in {pool} is backed up before reusing/repurposing this disk.',
        { pool: '\'' + unusedDisk.exported_zpool + '\'' },
      ),
    );
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const payload = this.pk.substring(5, this.pk.length);
    const { dev } = this.form.value;
    this.ws.call('boot.replace', [payload, dev]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.router.navigate(this.routeSuccess);
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(this.routeSuccess);
  }
}
