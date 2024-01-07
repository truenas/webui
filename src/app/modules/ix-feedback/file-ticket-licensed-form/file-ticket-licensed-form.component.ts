import {
  Component,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as EmailValidator from 'email-validator';
import {
  of,
} from 'rxjs';
import {
  TicketCategory, ticketCategoryLabels,
  TicketCriticality, ticketCriticalityLabels,
  TicketEnvironment, ticketEnvironmentLabels,
} from 'app/enums/file-ticket.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/ix-forms/validators/email-validation/email-validation';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-licensed-form.component.html',
})
export class FileTicketLicensedFormComponent {
  form = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, emailValidator()]],
    cc: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((item: string) => EmailValidator.validate(item));
        },
        this.translate.instant(helptext.cc.err),
      ),
    ]],
    phone: ['', [Validators.required]],
    category: [TicketCategory.Bug, [Validators.required]],
    environment: [TicketEnvironment.Production, [Validators.required]],
    criticality: [TicketCriticality.Inquiry, [Validators.required]],
    title: ['', Validators.required],
  });

  readonly categoryOptions$ = of(mapToOptions(ticketCategoryLabels, this.translate));
  readonly environmentOptions$ = of(mapToOptions(ticketEnvironmentLabels, this.translate));
  readonly criticalityOptions$ = of(mapToOptions(ticketCriticalityLabels, this.translate));

  readonly tooltips = {
    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    category: helptext.type.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
    title: helptext.title.tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) { }

  getPayload(): Partial<CreateNewTicket> {
    const values = { ...this.form.value };

    return {
      ...values,
      category: values.category,
      title: values.title,
    };
  }
}
