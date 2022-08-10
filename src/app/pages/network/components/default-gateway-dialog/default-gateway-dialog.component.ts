import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatDialogRef } from '@angular/material/dialog';
import { ipv4Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { DialogService, WebSocketService } from 'app/services';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { EntityUtils } from 'app/modules/entity/utils';
import helptext from 'app/helptext/network/configuration/configuration';
import helptextIpmi from 'app/helptext/network/ipmi/ipmi';

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
        this.validatorsService.withMessage(
          ipv4Validator(),
          this.translate.instant(helptextIpmi.ip_error),
        ),
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
    private dialog: DialogService,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  onSubmit(): void {
    this.dialogRef.close();
    const formValues = this.form.value;
    this.ws.call('interface.save_default_route', [formValues.defaultGateway]).pipe(
      catchError((error) => {
        new EntityUtils().errorReport(error, this.dialog);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
