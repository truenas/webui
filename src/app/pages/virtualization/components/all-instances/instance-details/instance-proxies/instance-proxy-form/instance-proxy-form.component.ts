import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import {
  VirtualizationDeviceType,
  VirtualizationProxyProtocol,
  virtualizationProxyProtocolLabels,
} from 'app/enums/virtualization.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { VirtualizationProxy } from 'app/interfaces/virtualization.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

interface FormOptions {
  instanceId: string;
  proxy: VirtualizationProxy | undefined;
}

@UntilDestroy()
@Component({
  selector: 'ix-instance-proxy-form',
  templateUrl: './instance-proxy-form.component.html',
  styleUrls: ['./instance-proxy-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    IxFieldsetComponent,
    IxInputComponent,
    MatButton,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    IxSelectComponent,
    ModalHeader2Component,
  ],
})
export class InstanceProxyFormComponent implements OnInit {
  private existingProxy = signal<VirtualizationProxy | null>(null);

  protected readonly isLoading = signal(false);

  protected form = this.formBuilder.nonNullable.group({
    source_proto: [VirtualizationProxyProtocol.Tcp],
    source_port: [null as number, Validators.required],
    dest_proto: [VirtualizationProxyProtocol.Tcp],
    dest_port: [null as number, Validators.required],
  });

  protected title = computed(() => {
    return this.existingProxy() ? this.translate.instant('Edit Proxy') : this.translate.instant('Add Proxy');
  });

  protected readonly protocolOptions$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private api: ApiService,
    private slideInRef: ChainedRef<FormOptions>,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    const proxy = this.slideInRef.getData().proxy;
    if (proxy) {
      this.existingProxy.set(proxy);
      this.form.patchValue(proxy);
    }
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const request$ = this.prepareRequest();
    request$
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Proxy saved'));
          this.slideInRef.close({
            error: false,
            response: true,
          });
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
        },
      });
  }

  private prepareRequest(): Observable<unknown> {
    const instanceId = this.slideInRef.getData().instanceId;
    const payload = {
      ...this.form.value,
      dev_type: VirtualizationDeviceType.Proxy,
    } as VirtualizationProxy;

    return this.existingProxy()
      ? this.api.call('virt.instance.device_update', [instanceId, {
        ...payload,
        name: this.existingProxy().name,
      }])
      : this.api.call('virt.instance.device_add', [instanceId, payload]);
  }
}
