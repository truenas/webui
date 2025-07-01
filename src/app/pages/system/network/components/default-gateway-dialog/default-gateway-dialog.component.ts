import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { NetworkConfigurationUpdate } from 'app/interfaces/network-configuration.interface';
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
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected readonly currentGateway = signal('');
  protected readonly currentDns1 = signal('');
  protected readonly currentDns2 = signal('');

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
  });

  readonly helptext = helptextNetworkConfiguration;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DefaultGatewayDialog>,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private loader: LoaderService,
  ) {}

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
        const gateway = summary.default_routes[0] || '';
        const dns1 = summary.nameservers[0] || '';
        const dns2 = summary.nameservers[1] || '';

        this.currentGateway.set(gateway);
        this.currentDns1.set(dns1);
        this.currentDns2.set(dns2);

        this.form.patchValue({
          defaultGateway: gateway,
          dns1,
          dns2,
        });
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.getRawValue();

    // Save default gateway first
    this.api.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      switchMap(() => {
        // Check if DNS settings need to be updated
        const dns1 = formValues.dns1?.trim();
        const dns2 = formValues.dns2?.trim();

        if (!dns1 && !dns2) {
          // No DNS changes needed
          return EMPTY;
        }

        // Build network configuration update object
        const networkConfig: Partial<NetworkConfigurationUpdate> = {};
        if (dns1) {
          networkConfig.nameserver1 = dns1;
        }
        if (dns2) {
          networkConfig.nameserver2 = dns2;
        }

        // Update DNS configuration
        return this.api.call('network.configuration.update', [networkConfig as NetworkConfigurationUpdate]).pipe(
          map(() => {
            this.snackbar.success(this.translate.instant('DNS settings updated successfully'));
          }),
        );
      }),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
