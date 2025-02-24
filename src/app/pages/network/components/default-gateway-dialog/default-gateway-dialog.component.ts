import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { helptextIpmi } from 'app/helptext/network/ipmi/ipmi';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-default-gateway-dialog',
  templateUrl: './default-gateway-dialog.component.html',
  styleUrls: ['./default-gateway-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  ],
})
export class DefaultGatewayDialogComponent {
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  form = this.fb.nonNullable.group({
    defaultGateway: [
      null as string | null,
      {
        validators: [
          this.validatorsService.withMessage(
            ipv4Validator(),
            this.translate.instant(helptextIpmi.ip_error),
          ),
          Validators.required,
        ],
        updateOn: 'blur',
      },
    ],
  });

  currentGateway$ = this.api.call('network.general.summary').pipe(
    toLoadingState(),
  );

  readonly helptext = helptextNetworkConfiguration;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DefaultGatewayDialogComponent>,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.getRawValue();
    this.api.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      catchError((error: unknown) => {
        this.dialog.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
