import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
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
import {
  IxDynamicFormComponent,
} from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudflareAuthValidator } from 'app/pages/credentials/certificates-dash/acmedns-form/cloudflare-auth.validator';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface DnsAuthenticatorList {
  key: DnsAuthenticatorType;
  variables: string[];
}

@Component({
  selector: 'ix-acmedns-form',
  templateUrl: './acmedns-form.component.html',
  styleUrl: './acmedns-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnBannerComponent,
    TnSelectComponent,
    TranslateModule,
    IxDynamicFormComponent,
  ],
})
export class AcmednsFormComponent extends SidePanelForm implements OnInit {
  private translate = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandlerService = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  form = this.formBuilder.nonNullable.group({
    name: [null as string | null, Validators.required],
    authenticator: [DnsAuthenticatorType.Cloudflare, Validators.required],
    attributes: this.formBuilder.group<Record<string, string>>({}, {
      validators: [(formGroup) => {
        if (this.form?.value.authenticator !== DnsAuthenticatorType.Cloudflare) {
          return null;
        }
        return CloudflareAuthValidator.validate(this.translate)(formGroup);
      }],
    }),
  });

  get formGroup(): UntypedFormGroup {
    return this.form.controls.attributes as UntypedFormGroup;
  }

  protected isLoading = signal(false);
  protected isLoadingSchemas = signal(true);

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  /** Authenticator to edit, supplied by the `<tn-side-panel>` host. Absent for Add. */
  readonly editingAuthenticator = input<DnsAuthenticator | undefined>(undefined);

  dynamicSection: DynamicFormSchema[] = [];
  dnsAuthenticatorList: DnsAuthenticatorList[] = [];

  readonly helptext = helptext;

  private getAuthenticatorSchemas(): Observable<AuthenticatorSchema[]> {
    return this.api.call('acme.dns.authenticator.authenticator_schemas');
  }

  authenticatorOptions$: Observable<Option[]>;
  private editingAcmedns: DnsAuthenticator | undefined;

  ngOnInit(): void {
    this.editingAcmedns = this.editingAuthenticator();

    this.loadSchemas();

    // Listen to authenticator type changes
    this.form.controls.authenticator.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authenticatorType) => {
        this.onAuthenticatorTypeChanged(authenticatorType);
      });
  }

  private loadSchemas(): void {
    this.isLoading.set(true);
    this.getAuthenticatorSchemas()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((schemas: AuthenticatorSchema[]) => {
        this.setAuthenticatorOptions(schemas);
        this.createAuthenticatorControls(schemas);

        if (this.editingAcmedns) {
          this.form.patchValue(this.editingAcmedns);
          const authenticatorType = this.editingAcmedns.attributes.authenticator as DnsAuthenticatorType;
          if (authenticatorType) {
            this.form.patchValue({ authenticator: authenticatorType });
            this.onAuthenticatorTypeChanged(authenticatorType);
          }
        }

        // Setup validation listeners after controls are created
        this.setupCloudflareValidation();

        this.isLoading.set(false);
        this.isLoadingSchemas.set(false);
      });
  }

  private setAuthenticatorOptions(schemas: AuthenticatorSchema[]): void {
    this.authenticatorOptions$ = of(schemas.map((schema) => ({ label: schema.key, value: schema.key })));
  }

  private createAuthenticatorControls(schemas: AuthenticatorSchema[]): void {
    schemas.forEach((schema) => {
      Object.values(schema.schema.properties).forEach((property) => {
        this.form.controls.attributes.addControl(
          property._name_,
          new FormControl(property.const || '', property._required_ ? [Validators.required] : []),
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
  }

  parseSchemaForDynamicSchema(schema: AuthenticatorSchema): DynamicFormSchemaNode[] {
    return Object.values(schema.schema.properties)
      .filter((property) => !property.const)
      .map((property) => getDynamicFormSchemaNode(property));
  }

  private parseSchemaForDnsAuthList(schema: AuthenticatorSchema): DnsAuthenticatorList {
    const variables = Object.values(schema.schema.properties).map((property) => property._name_);
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
    // Re-validate when authenticator type changes
    this.form.controls.attributes.updateValueAndValidity();
  }

  private setupCloudflareValidation(): void {
    const attributes = this.form.controls.attributes;

    // Listen to value changes on Cloudflare fields to re-validate
    ['cloudflare_email', 'api_key', 'api_token'].forEach((fieldName) => {
      const control = attributes.get(fieldName);
      if (control) {
        control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          attributes.updateValueAndValidity();
        });
      }
    });
  }

  protected isCloudflareAuthenticator(): boolean {
    return this.form.value.authenticator === DnsAuthenticatorType.Cloudflare;
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandlerService.handleValidationErrors(error, this.form);
      },
    });
  }
}
