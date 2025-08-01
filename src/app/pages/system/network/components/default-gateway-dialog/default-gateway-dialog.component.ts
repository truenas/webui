import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import {
  FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-default-gateway-dialog',
  templateUrl: './default-gateway-dialog.component.html',
  styleUrls: ['./default-gateway-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DefaultGatewayDialog implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);
  private dialogRef = inject<MatDialogRef<DefaultGatewayDialog>>(MatDialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private loader = inject(LoaderService);
  data = inject<{
    ipv4gateway?: string;
    nameserver1?: string;
    nameserver2?: string;
    nameserver3?: string;
  }>(MAT_DIALOG_DATA);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected readonly currentGateway = signal('');
  protected readonly currentDns1 = signal('');
  protected readonly currentDns2 = signal('');
  protected readonly currentDns3 = signal('');

  form = this.fb.nonNullable.group({
    defaultGateway: [
      '',
      {
        validators: [
          ipv4Validator(),
          Validators.required,
        ],
      },
    ],
    dns1: ['', [ipv4Validator()]],
    dns2: ['', [ipv4Validator()]],
    dns3: ['', [ipv4Validator()]],
  });

  readonly helptext = helptextNetworkConfiguration;

  ngOnInit(): void {
    this.loadNetworkSummary();
  }

  private loadNetworkSummary(): void {
    this.api.call('network.general.summary')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((summary) => {
        const gateway = this.data?.ipv4gateway || summary.default_routes[0] || '';
        const dns1 = this.data?.nameserver1 || summary.nameservers[0] || '';
        const dns2 = this.data?.nameserver2 || summary.nameservers[1] || '';
        const dns3 = this.data?.nameserver3 || summary.nameservers[2] || '';

        this.currentGateway.set(gateway);
        this.currentDns1.set(dns1);
        this.currentDns2.set(dns2);
        this.currentDns3.set(dns3);

        this.form.patchValue({
          defaultGateway: gateway,
          dns1,
          dns2,
          dns3,
        });
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.getRawValue();

    // Build network configuration object
    const networkConfig = {
      ipv4gateway: formValues.defaultGateway,
      ...(formValues.dns1 && { nameserver1: formValues.dns1.trim() }),
      ...(formValues.dns2 && { nameserver2: formValues.dns2.trim() }),
      ...(formValues.dns3 && { nameserver3: formValues.dns3.trim() }),
    };

    // Save network configuration using the new API
    this.api.call('interface.save_network_config', [networkConfig]).pipe(
      map(() => {
        this.snackbar.success(this.translate.instant('Network configuration updated successfully'));
      }),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
