import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/services/components/service-lldp';
import { LldpConfigUpdate } from 'app/interfaces/lldp-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './service-lldp.component.html',
  styleUrls: ['./service-lldp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceLldpComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    intdesc: [false],
    country: ['', [Validators.required]],
    location: [''],
  });

  intdesc: {
    readonly fcName: 'intdesc';
    label: string;
    tooltip: string;
  } = {
    fcName: 'intdesc',
    label: helptext.lldp_intdesc_placeholder,
    tooltip: helptext.lldp_intdesc_tooltip,
  };

  country: {
    readonly fcName: 'country';
    label: string;
    tooltip: string;
  } = {
    fcName: 'country',
    label: helptext.lldp_country_placeholder,
    tooltip: helptext.lldp_country_tooltip,
  };

  location: {
    readonly fcName: 'location';
    label: string;
    tooltip: string;
  } = {
    fcName: 'location',
    label: helptext.lldp_location_placeholder,
    tooltip: helptext.lldp_location_tooltip,
  };

  locationProvider = new SimpleAsyncComboboxProvider(this.ws.call('lldp.country_choices').pipe(choicesToOptions()));

  constructor(
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private formErrorHandler: FormErrorHandlerService,
    private slideInRef: IxSlideInRef<ServiceLldpComponent>,
  ) { }

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('lldp.config').pipe(untilDestroyed(this)).subscribe(
      {
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      },
    );
  }

  onSubmit(): void {
    const values = this.form.value as LldpConfigUpdate;

    this.isFormLoading = true;

    this.ws.call('lldp.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
