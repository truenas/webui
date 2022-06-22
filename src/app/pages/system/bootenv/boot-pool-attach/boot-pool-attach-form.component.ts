import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './boot-pool-attach-form.component.html',
  styleUrls: ['./boot-pool-attach-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootPoolAttachFormComponent {
  isFormLoading = false;

  form = this.fb.group({
    dev: ['', Validators.required],
    expand: [false],
  });

  dev = {
    fcName: 'dev',
    label: this.translate.instant(helptextSystemBootenv.dev_placeholder),
    tooltip: this.translate.instant(helptextSystemBootenv.dev_tooltip),
    options: this.ws.call('disk.get_unused').pipe(
      map((disks) => {
        return disks.map((disk) => ({
          label: `${disk.name} (${filesize(disk['size'], { standard: 'iec' })})`,
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
