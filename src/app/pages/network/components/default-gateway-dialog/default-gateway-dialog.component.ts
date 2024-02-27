import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import { helptextIpmi } from 'app/helptext/network/ipmi/ipmi';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './default-gateway-dialog.component.html',
  styleUrls: ['./default-gateway-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultGatewayDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

  form = this.fb.group({
    defaultGateway: [
      null,
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

  currentGateway$ = this.ws.call('network.general.summary').pipe(
    toLoadingState(),
  );

  readonly helptext = helptextNetworkConfiguration;

  constructor(
    private ws: WebSocketService,
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
    const formValues = this.form.value;
    this.ws.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      catchError((error: unknown) => {
        this.dialog.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
