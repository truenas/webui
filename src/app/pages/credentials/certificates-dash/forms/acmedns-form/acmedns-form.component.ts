import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { Role } from 'app/enums/role.enum';
import { getDynamicFormSchemaNode } from 'app/helpers/get-dynamic-form-schema-node';
import { helptextSystemAcme as helptext } from 'app/helptext/system/acme';
import { AuthenticatorSchema, DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import {
  DynamicFormSchema, DynamicFormSchemaNode,
} from 'app/interfaces/dynamic-form-schema.interface';
import { Option } from 'app/interfaces/option.interface';
import { CustomUntypedFormField } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-field';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

interface DnsAuthenticatorList {
  key: DnsAuthenticatorType;
  variables: string[];
}

@UntilDestroy()
@Component({
  selector: 'ix-acmedns-form',
  templateUrl: './acmedns-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcmednsFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

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
    attributes: this.formBuilder.group<Record<string, string>>({}),
  });

  get formGroup(): UntypedFormGroup {
    return this.form.controls.attributes as UntypedFormGroup;
  }

  isLoading = false;
  isLoadingSchemas = true;
  dynamicSection: DynamicFormSchema[] = [];
  dnsAuthenticatorList: DnsAuthenticatorList[] = [];

  readonly helptext = helptext;

  getAuthenticatorSchemas(): Observable<AuthenticatorSchema[]> {
    return this.ws.call('acme.dns.authenticator.authenticator_schemas');
  }

  authenticatorOptions$: Observable<Option[]>;
  private editingAcmedns: DnsAuthenticator;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private slideInRef: IxSlideInRef<AcmednsFormComponent>,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(SLIDE_IN_DATA) private acmedns: DnsAuthenticator,
  ) {}

  ngOnInit(): void {
    if (this.acmedns) {
      this.editingAcmedns = this.acmedns;
    }

    this.loadSchemas();
  }

  private loadSchemas(): void {
    this.isLoading = true;
    this.getAuthenticatorSchemas()
      .pipe(untilDestroyed(this))
      .subscribe((schemas: AuthenticatorSchema[]) => {
        this.setAuthenticatorOptions(schemas);
        this.createAuthenticatorControls(schemas);

        if (!this.isNew) {
          this.form.patchValue(this.editingAcmedns);
        }

        this.isLoading = false;
        this.isLoadingSchemas = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  private setAuthenticatorOptions(schemas: AuthenticatorSchema[]): void {
    this.authenticatorOptions$ = of(schemas.map((schema) => ({ label: schema.key, value: schema.key })));
  }

  private createAuthenticatorControls(schemas: AuthenticatorSchema[]): void {
    schemas.forEach((schema) => {
      schema.schema.forEach((input) => {
        this.form.controls.attributes.addControl(input._name_, new FormControl('', input._required_ ? [Validators.required] : []));
      });
    });

    this.dynamicSection = [{
      name: '',
      description: '',
      schema: Array.from(
        new Map(
          schemas
            .flatMap((schema) => this.parseSchemaForDynamicSchema(schema))
            .map((item) => [item.controlName, item]),
        ).values(),
      ),
    }];

    this.dnsAuthenticatorList = schemas.map((schema) => this.parseSchemaForDnsAuthList(schema));
    this.onAuthenticatorTypeChanged(DnsAuthenticatorType.Cloudflare);
  }

  parseSchemaForDynamicSchema(schema: AuthenticatorSchema): DynamicFormSchemaNode[] {
    return schema.schema.map((input) => getDynamicFormSchemaNode(input));
  }

  parseSchemaForDnsAuthList(schema: AuthenticatorSchema): DnsAuthenticatorList {
    const variables = schema.schema.map((input) => input._name_);
    return { key: schema.key, variables };
  }

  onAuthenticatorTypeChanged(event: DnsAuthenticatorType): void {
    this.dnsAuthenticatorList.forEach((auth) => {
      if (auth.key === event) {
        auth.variables.forEach((variable) => {
          const formField = this.form.controls.attributes.controls[variable] as unknown as CustomUntypedFormField;
          formField.enable();
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject<boolean>(false);
          }
          formField.hidden$.next(false);
        });
      } else {
        auth.variables.forEach((variable) => {
          const formField = this.form.controls.attributes.controls[variable] as unknown as CustomUntypedFormField;
          formField.disable();
          if (!formField.hidden$) {
            formField.hidden$ = new BehaviorSubject<boolean>(false);
          }
          formField.hidden$.next(true);
        });
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
      if (value == null || value === '') {
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

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
