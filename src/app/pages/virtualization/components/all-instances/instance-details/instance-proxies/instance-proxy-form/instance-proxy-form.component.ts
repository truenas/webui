import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
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
import { WebSocketService } from 'app/services/ws.service';

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
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    IxSelectComponent,
    ModalHeader2Component,
  ],
})
export class InstanceProxyFormComponent {
  protected readonly isLoading = signal(false);

  protected form = this.formBuilder.nonNullable.group({
    source_proto: [VirtualizationProxyProtocol.Tcp],
    source_port: [null as number, Validators.required],
    dest_proto: [VirtualizationProxyProtocol.Tcp],
    dest_port: [null as number, Validators.required],
  });

  protected readonly protocolOptions$ = of(mapToOptions(virtualizationProxyProtocolLabels, this.translate));

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private ws: WebSocketService,
    private slideInRef: ChainedRef<string>,
    private translate: TranslateService,
    private snackbar: SnackbarService,
  ) {}

  onSubmit(): void {
    const instanceId = this.slideInRef.getData();

    this.isLoading.set(true);
    const payload = {
      ...this.form.value,
      dev_type: VirtualizationDeviceType.Proxy,
    } as VirtualizationProxy;

    this.ws.call('virt.instance.device_add', [instanceId, payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Proxy added'));
          this.slideInRef.close({
            error: false,
            response: true,
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading.set(false);
        },
      });
  }
}
