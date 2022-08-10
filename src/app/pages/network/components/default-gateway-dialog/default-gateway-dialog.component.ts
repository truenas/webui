import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ipv4Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { WebSocketService } from 'app/services';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import helptext from 'app/helptext/network/configuration/configuration';

@UntilDestroy()
@Component({
  templateUrl: './default-gateway-dialog.component.html',
  styleUrls: ['./default-gateway-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultGatewayDialogComponent {

  form = this.fb.group({
    defaultGateway: [
      null as string,
      [
        ipv4Validator(),
        Validators.required,
      ],
    ],
  });

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<DefaultGatewayDialogComponent>,
    private errorHandler: FormErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.value;
    this.ws.call('interface.save_default_route', [formValues.defaultGateway]).pipe(untilDestroyed(this)).subscribe(
      () => {
      },
      (error) => {
        this.errorHandler.handleWsFormError(error, this.form);
      },
    );
  }
}
