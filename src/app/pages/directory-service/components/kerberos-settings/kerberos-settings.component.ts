import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/directory-service/kerberos-settings';
import { KerberosConfigUpdate } from 'app/interfaces/kerberos-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './kerberos-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KerberosSettingsComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    appdefaults_aux: [''],
    libdefaults_aux: [''],
  });

  readonly tooltips = {
    appdefaults_aux: helptext.ks_appdefaults_tooltip,
    libdefaults_aux: helptext.ks_libdefaults_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<KerberosSettingsComponent>,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('kerberos.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('kerberos.update', [values as KerberosConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
