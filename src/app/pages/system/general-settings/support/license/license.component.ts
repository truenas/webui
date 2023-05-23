import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './license.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenseComponent {
  isFormLoading = false;

  title = helptext.update_license.license_placeholder;
  form = this.fb.group({
    license: ['', Validators.required],
  });

  license = {
    fcName: 'license',
    label: helptext.update_license.license_placeholder,
  };

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private slideInService: IxSlideInService,
    protected ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {}

  onSubmit(): void {
    this.isFormLoading = true;

    const { license } = this.form.value;
    this.ws.call('system.license_update', [license]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        // To make sure EULA opens on reload; removed from local storage (in topbar) on acceptance of EULA
        this.window.localStorage.setItem('upgrading_status', 'upgrading');
        this.slideInService.closeLast();
        this.cdr.markForCheck();
        setTimeout(() => {
          this.dialogService.confirm({
            title: helptext.update_license.reload_dialog_title,
            message: helptext.update_license.reload_dialog_message,
            hideCheckbox: true,
            buttonText: helptext.update_license.reload_dialog_action,
            hideCancel: true,
            disableClose: true,
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            document.location.reload();
          });
        }, 200);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
