import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { helptextSystemAcme as helptext } from 'app/helptext/system/acme';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DynamicFieldsSchema } from 'app/interfaces/dynamic-fields-schema.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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

  isLoading = false;
  attributes: DynamicFieldsSchema[] = [];
  selectAuthenticator = DnsAuthenticatorType.Cloudflare;

  readonly helptext = helptext;

  authenticator_options$ = this.ws.call('acme.dns.authenticator.authenticator_schemas').pipe(
    map((schemas) => {
      this.attributes = [];
      const opts = [];
      for (const schema of schemas) {
        opts.push({ label: schema.key, value: schema.key });
        for (const input of schema.schema) {
          this.form.controls.attributes.addControl(
            input._name_,
            new FormControl('', input._required_ ? [Validators.required] : []),
          );
          this.attributes.push({
            name: input._name_,
            type: 'input',
            title: input.title,
            required: input._required_,
            show_if: [schema.key],
          });
        }
      }
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
    this.selectAuthenticator = event;
    for (const attribute of this.attributes) {
      if (attribute.show_if.includes(event)) {
        this.form.controls.attributes.controls[attribute.name].enable();
        attribute.hidden = false;
      } else {
        this.form.controls.attributes.controls[attribute.name].disable();
        attribute.hidden = true;
      }
    }
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
