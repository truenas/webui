import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { map } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
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
    label: this.translate.instant(helptext_system_bootenv.dev_placeholder),
    tooltip: this.translate.instant(helptext_system_bootenv.dev_tooltip),
    options: this.ws.call('disk.get_unused').pipe(
      map((disks) => {
        const options = disks.map((disk) => ({
          label: `${disk.name} (${filesize(disk['size'], { standard: 'iec' })})`,
          value: disk.name,
        }));

        return [
          { label: '-', value: null },
          ...options,
        ];
      }),
    ),
  };

  expand = {
    fcName: 'expand',
    label: this.translate.instant(helptext_system_bootenv.expand_placeholder),
    tooltip: this.translate.instant(helptext_system_bootenv.expand_tooltip),
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
      if (job.state === JobState.Success) {
        this.isFormLoading = false;
        this.dialogService.info(helptext_system_bootenv.attach_dialog.title,
          `<i>${dev}</i> ${helptext_system_bootenv.attach_dialog.message}`, '300px', 'info', true)
          .pipe(untilDestroyed(this)).subscribe(() => {
            this.router.navigate(['system', 'boot']);
          });
      }
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
