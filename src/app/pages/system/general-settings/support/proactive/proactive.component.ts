import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { SupportConfigUpdate } from 'app/interfaces/support.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
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

  readonly labels = {
    pc_name: helptext.proactive.pc_name_placeholder,
    pc_title: helptext.proactive.pc_title_placeholder,
    pc_email: helptext.proactive.pc_email_placeholder,
    pc_phone: helptext.proactive.pc_phone_placeholder,
    enable_checkbox: helptext.proactive.enable_checkbox_placeholder,
    sec_name: helptext.proactive.sec_name_placeholder,
    sec_title: helptext.proactive.sec_title_placeholder,
    sec_email: helptext.proactive.sec_email_placeholder,
    sec_phone: helptext.proactive.sec_phone_placeholder,
  };

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    protected loader: AppLoaderService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    const values = this.form.value as SupportConfigUpdate;

    this.isLoading = true;
    this.ws.call('support.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isLoading = false;
          this.slideInService.close();
          this.cdr.markForCheck();
          this.dialogService.info(helptext.proactive.dialog_title,
            helptext.proactive.dialog_mesage, '350px', 'info', true);
        }, (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }

  private loadConfig(): void {
    this.isLoading = true;
    this.ws.call('support.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(null, error, this.dialogService);
        },
      );
  }
}
// this.ws.call('support.is_available') if available support
