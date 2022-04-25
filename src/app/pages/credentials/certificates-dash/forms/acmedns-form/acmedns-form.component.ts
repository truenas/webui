import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { helptextSystemAcme as helptext } from 'app/helptext/system/acme';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

interface DnsAuthenticatorList {
  key: string;
  variables: string[];
}

@UntilDestroy()
@Component({
  templateUrl: './acmedns-form.component.html',
  styleUrls: ['./acmedns-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcmednsFormComponent {
  get isNew(): boolean {
    return !this.editingAcmedns;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptext.add_title)
      : this.translate.instant(helptext.edit_title);
  }

  form = this.formBuilder.group({
    name: [null as string, Validators.required],
    authenticator: [DnsAuthenticatorType.Cloudflare, Validators.required],
    attributes: this.formBuilder.group({}),
  });

  get formGroup(): FormGroup {
    return this.form.controls['attributes'] as FormGroup;
  }

  isLoading = false;
  dynamicSection: DynamicFormSchema[] = [];
  dnsAuthenticatorList: DnsAuthenticatorList[] = [];

  readonly helptext = helptext;

  authenticator_options$ = this.ws.call('acme.dns.authenticator.authenticator_schemas').pipe(
    map((schemas) => {
      const dynamicSchema: DynamicFormSchema = { name: '', description: '', schema: [] };
      const opts = [];
      this.dnsAuthenticatorList = [];
      this.dynamicSection = [];

      for (const schema of schemas) {
        const variables: string[] = [];
        for (const input of schema.schema) {
          const newFormControl = new FormControl('', input._required_ ? [Validators.required] : []);
          this.form.controls.attributes.addControl(input._name_, newFormControl);
          dynamicSchema.schema.push({
            variable: input._name_,
            type: 'input',
            title: input.title,
            required: input._required_,
          });
          variables.push(input._name_);
        }

        this.dnsAuthenticatorList.push({ key: schema.key, variables });
        opts.push({ label: schema.key, value: schema.key });
      }

      this.dynamicSection.push(dynamicSchema);
      this.onChange(DnsAuthenticatorType.Cloudflare);
      if (!this.isNew) {
        this.form.patchValue(this.editingAcmedns);
      }
      return opts;
    }),
  );

  private editingAcmedns: DnsAuthenticator;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
  ) {}

  setAcmednsForEdit(acmedns: DnsAuthenticator): void {
    this.editingAcmedns = acmedns;
  }

  onChange(event: DnsAuthenticatorType): void {
    this.dnsAuthenticatorList.forEach((auth) => {
      if (auth.key === event) {
        auth.variables.forEach((varible) => this.form.controls.attributes.controls[varible].enable());
      } else {
        auth.variables.forEach((varible) => this.form.controls.attributes.controls[varible].disable());
      }
    });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
    };

    if (!this.isNew) {
      delete values.authenticator;
    }

    for (const [key, value] of Object.entries(values.attributes)) {
      if (!value) {
        delete values.attributes[key];
      }
    }

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('acme.dns.authenticator.create', [values]);
    } else {
      request$ = this.ws.call('acme.dns.authenticator.update', [
        this.editingAcmedns.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
