import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { SupportConfigUpdate } from 'app/interfaces/support.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: 'proactive.component.html',
  styleUrls: ['./proactive.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ProactiveComponent implements OnInit {
  isLoading = false;
  title = helptext.proactive.title;
  isFormDisabled = false;
  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    title: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    enabled: [false],
    secondary_name: ['', [Validators.required]],
    secondary_title: ['', [Validators.required]],
    secondary_email: ['', [Validators.required, Validators.email]],
    secondary_phone: ['', [Validators.required]],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    const values = this.form.value as SupportConfigUpdate;
    this.isLoading = true;

    this.ws.call('support.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();

          this.snackbar.success(
            this.translate.instant(helptext.proactive.dialog_mesage),
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadConfig(): void {
    this.isLoading = true;

    forkJoin([
      this.ws.call('support.config'),
      this.ws.call('support.is_available'),
      this.ws.call('support.is_available_and_enabled'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, isAvailable, isEnabled]) => {
          this.isLoading = false;
          this.cdr.markForCheck();

          if (!isAvailable) {
            this.supportUnavailable();
            return;
          }
          this.form.patchValue({
            ...config,
            enabled: isEnabled,
          });
        },
        error: (error) => {
          this.isFormDisabled = true;
          this.form.disable();
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  supportUnavailable(): void {
    this.isFormDisabled = true;
    this.form.disable();
    this.dialogService.warn(
      helptext.proactive.dialog_unavailable_title,
      helptext.proactive.dialog_unavailable_warning,
    );
  }
}
