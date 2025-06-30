import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
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
    WithLoadingStateDirective,
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
    CopyButtonComponent,
  ],
})
export class DefaultGatewayDialog implements OnInit {
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected currentGateway = '';
  protected currentDns1 = '';
  protected currentDns2 = '';

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
    dns1: [
      '',
      {
        validators: [
          this.optionalIpValidator(),
        ],
      },
    ],
    dns2: [
      '',
      {
        validators: [
          this.optionalIpValidator(),
        ],
      },
    ],
  });

  currentGateway$ = this.api.call('network.general.summary').pipe(
    map((summary) => {
      this.currentGateway = summary.default_routes[0] || '';
      this.currentDns1 = summary.nameservers[0] || '';
      this.currentDns2 = summary.nameservers[1] || '';
      return summary;
    }),
    toLoadingState(),
  );

  readonly helptext = helptextNetworkConfiguration;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DefaultGatewayDialog>,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  ngOnInit(): void {
    this.currentGateway$.pipe(untilDestroyed(this)).subscribe((state) => {
      if (!state.isLoading && state.value) {
        const currentGateway = state.value.default_routes[0];
        if (currentGateway) {
          this.form.patchValue({ defaultGateway: currentGateway });
        }

        const currentDns1 = state.value.nameservers[0];
        if (currentDns1) {
          this.form.patchValue({ dns1: currentDns1 });
        }

        const currentDns2 = state.value.nameservers[1];
        if (currentDns2) {
          this.form.patchValue({ dns2: currentDns2 });
        }
      }
    });
  }

  private optionalIpValidator() {
    return (control: FormControl<string>) => {
      if (!control.value || control.value.trim() === '') {
        return null; // Valid if empty
      }
      return ipv4Validator()(control);
    };
  }

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.getRawValue();

    // Save DNS entries to session storage for later use
    if (formValues.dns1?.trim()) {
      sessionStorage.setItem('pending-dns1', formValues.dns1.trim());
    } else {
      sessionStorage.removeItem('pending-dns1');
    }

    if (formValues.dns2?.trim()) {
      sessionStorage.setItem('pending-dns2', formValues.dns2.trim());
    } else {
      sessionStorage.removeItem('pending-dns2');
    }

    this.api.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
