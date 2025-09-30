import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import { UntypedFormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, pairwise } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
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
import {
  IxDynamicFormComponent,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface DnsAuthenticatorList {
  key: DnsAuthenticatorType;
  variables: string[];
}

@UntilDestroy()
@Component({
  selector: 'ix-acmedns-form',
  templateUrl: './acmedns-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxDynamicFormComponent,
  ],
})
export class AcmednsFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandlerService = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  slideInRef = inject<SlideInRef<DnsAuthenticator | undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  get isNew(): boolean {
    return !this.editingAcmedns;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptext.addTitle)
      : this.translate.instant(helptext.editTitle);
  }

  form = this.formBuilder.nonNullable.group({
    name: [null as string | null, Validators.required],
    authenticator: [DnsAuthenticatorType.Cloudflare, Validators.required],
    attributes: this.formBuilder.group<Record<string, string>>({}),
  });

  get formGroup(): UntypedFormGroup {
    return this.form.controls.attributes as UntypedFormGroup;
  }

  protected isLoading = signal(false);
  protected isLoadingSchemas = signal(true);

  dynamicSection: DynamicFormSchema[] = [];
  dnsAuthenticatorList: DnsAuthenticatorList[] = [];

  readonly helptext = helptext;

  private getAuthenticatorSchemas(): Observable<AuthenticatorSchema[]> {
    return this.api.call('acme.dns.authenticator.authenticator_schemas');
  }

  authenticatorOptions$: Observable<Option[]>;
  private editingAcmedns: DnsAuthenticator | undefined;

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingAcmedns = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.loadSchemas();
  }

  private loadSchemas(): void {
    this.isLoading.set(true);
    this.getAuthenticatorSchemas()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((schemas: AuthenticatorSchema[]) => {
        this.setAuthenticatorOptions(schemas);
        this.createAuthenticatorControls(schemas);

        if (this.editingAcmedns) {
          this.form.patchValue(this.editingAcmedns);
        }

        this.isLoading.set(false);
        this.isLoadingSchemas.set(false);
      });
  }

  private setAuthenticatorOptions(schemas: AuthenticatorSchema[]): void {
    this.authenticatorOptions$ = of(schemas.map((schema) => ({ label: schema.key, value: schema.key })));
  }

  private setupConditionalValidation(): void {
    /* cloudflare DNS is a special case where the user can either input
    * both an email and an API key OR just an API token
    * so to make this apparent to the user, we'll hardcode this special case */

    const cfEmail = this.form.controls.attributes.get(['cloudflare_email']) as FormControl<string>;
    const cfKey = this.form.controls.attributes.get(['api_key']) as FormControl<string>;
    const cfToken = this.form.controls.attributes.get(['api_token']) as FormControl<string>;

    const mustBeEmpty = (control: AbstractControl): ValidationErrors | null => {
      return control.value !== '' ? { cannotUse: { message: 'email/API key cannot be used with token' } } : null;
    };

    const setRequiredFields = (req: FormControl<string>[], notReq: FormControl<string>[]): void => {
      req.forEach((elem) => elem.setValidators([Validators.required], { emitEvent: false }));
      notReq.forEach((elem) => elem.setValidators([mustBeEmpty], { emitEvent: false }));
    };

    this.form.valueChanges.pipe(pairwise(), untilDestroyed(this)).subscribe(([prev, next]) => {
      if (next.authenticator !== DnsAuthenticatorType.Cloudflare) {
        return;
      }

      const emailInput = next.attributes?.cloudflare_email;
      const keyInput = next.attributes?.api_key;
      const tokenInput = next.attributes?.api_token;

      // determine which field was *just* edited to help assume user intent.
      let edited: 'email' | 'key' | 'token' | null = null;
      if (prev.attributes?.cloudflare_email !== next.attributes?.cloudflare_email) {
        edited = 'email';
      } else if (prev.attributes?.api_key !== next.attributes?.api_key) {
        edited = 'key';
      } else if (prev.attributes?.api_token !== next.attributes?.api_token) {
        edited = 'token';
      }

      // case: all fields are empty
      if (emailInput === '' && keyInput === '' && tokenInput === '') {
        // set *all* fields required just so the user has to put *something* in.
        setRequiredFields([cfEmail, cfKey, cfToken], []);

        // case: the user just edited the email or key fields
      } else if (edited === 'email' || edited === 'key') {
        // if they zeroed out both of them - assume they want to input a token
        if (emailInput === '' && keyInput === '') {
          setRequiredFields([cfToken], [cfEmail, cfKey]);

          // otherwise, assume they want to input an email/key pair
        } else {
          setRequiredFields([cfEmail, cfKey], [cfToken]);
        }

        // case: the user just edited the token field
      } else if (edited === 'token') {
        // if they zeroed it out, assume they want to input an email/key pair.
        if (tokenInput === '') {
          setRequiredFields([cfEmail, cfKey], [cfToken]);

          // otherwise, assume they want to input a token.
        } else {
          setRequiredFields([cfToken], [cfEmail, cfKey]);
        }
      }


      cfEmail.updateValueAndValidity({ onlySelf: true });
      cfKey.updateValueAndValidity({ onlySelf: true });
      cfToken.updateValueAndValidity({ onlySelf: true });
    });
  }

  private createAuthenticatorControls(schemas: AuthenticatorSchema[]): void {
    schemas.forEach((schema) => {
      Object.values(schema.schema.properties).forEach((input) => {
        this.form.controls.attributes.addControl(
          input._name_,
          new FormControl(input.const || '', input._required_ ? [Validators.required] : []),
        );
      });
    });

    this.dynamicSection = [{
      name: '',
      description: '',
      schema: schemas
        .map((schema) => this.parseSchemaForDynamicSchema(schema))
        .reduce((all, val) => all.concat(val), []),
    }];

    this.dnsAuthenticatorList = schemas.map((schema) => this.parseSchemaForDnsAuthList(schema));
    this.onAuthenticatorTypeChanged(DnsAuthenticatorType.Cloudflare);
    this.setupConditionalValidation();
  }

  parseSchemaForDynamicSchema(schema: AuthenticatorSchema): DynamicFormSchemaNode[] {
    return Object.values(schema.schema.properties)
      .filter((input) => !input.const)
      .map((input) => getDynamicFormSchemaNode(input));
  }

  private parseSchemaForDnsAuthList(schema: AuthenticatorSchema): DnsAuthenticatorList {
    const variables = Object.values(schema.schema.properties).map((input) => input._name_);
    return { key: schema.key, variables };
  }

  protected onAuthenticatorTypeChanged(event: DnsAuthenticatorType): void {
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

  protected onSubmit(): void {
    const values = {
      name: this.form.value.name,
      attributes: this.form.value.attributes,
    };

    values.attributes.authenticator = this.form.value.authenticator;

    for (const [key, value] of Object.entries(values.attributes)) {
      if (value == null || value === '') {
        delete values.attributes[key];
      }
    }

    this.isLoading.set(true);
    let request$: Observable<unknown>;

    if (this.editingAcmedns) {
      request$ = this.api.call('acme.dns.authenticator.update', [
        this.editingAcmedns.id,
        values,
      ]);
    } else {
      request$ = this.api.call('acme.dns.authenticator.create', [values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandlerService.handleValidationErrors(error, this.form);
      },
    });
  }
}
