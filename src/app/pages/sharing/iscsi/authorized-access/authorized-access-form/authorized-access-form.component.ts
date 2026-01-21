import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiAuthAccess, IscsiAuthAccessUpdate } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import {
  doesNotEqualFgValidator,
  matchOthersFgValidator,
} from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-authorized-access-form',
  templateUrl: './authorized-access-form.component.html',
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
  ],
})
export class AuthorizedAccessFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private formBuilder = inject(NonNullableFormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  slideInRef = inject<SlideInRef<IscsiAuthAccess | undefined, boolean>>(SlideInRef);

  get isNew(): boolean {
    return !this.editingAccess;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Authorized Access')
      : this.translate.instant('Edit Authorized Access');
  }

  form = this.formBuilder.group({
    tag: [null as number | null, [Validators.required, Validators.min(0)]],
    user: ['', Validators.required],
    secret: ['', [
      Validators.minLength(12),
      Validators.maxLength(16),
      Validators.required,
    ]],
    secret_confirm: ['', Validators.required],
    peeruser: [''],
    peersecret: ['', [
      Validators.minLength(12),
      Validators.maxLength(16),
    ]],
    peersecret_confirm: [''],
    discovery_auth: [IscsiAuthMethod.None],
  }, {
    validators: [
      matchOthersFgValidator(
        'secret',
        ['secret_confirm'],
        this.translate.instant('Secret and confirmation should match.'),
      ),
      matchOthersFgValidator(
        'peersecret',
        ['peersecret_confirm'],
        this.translate.instant('Secret and confirmation should match.'),
      ),
      doesNotEqualFgValidator(
        'peersecret',
        ['secret'],
        this.translate.instant('Secret and Peer Secret cannot be the same.'),
      ),
    ],
  });

  protected isLoading = signal(false);
  discoveryAuthOptions$: Observable<Option<IscsiAuthMethod>[]> = of([
    {
      label: 'NONE',
      value: IscsiAuthMethod.None,
    },
    {
      label: 'CHAP',
      value: IscsiAuthMethod.Chap,
    },
    {
      label: 'Mutual CHAP',
      value: IscsiAuthMethod.ChapMutual,
    },
  ]);

  protected editingAccess: IscsiAuthAccess | undefined;

  readonly tooltips = {
    tag: helptextIscsi.authaccess.tagTooltip,
    user: helptextIscsi.authaccess.userTooltip,
    secret: helptextIscsi.authaccess.secretTooltip,
    peeruser: helptextIscsi.authaccess.peeruserTooltip,
    peersecret: helptextIscsi.authaccess.peersecretTooltip,
    discovery_auth: helptextIscsi.portal.discoveryAuthMethodTooltip,
  };

  protected readonly requiredRoles = [
    Role.SharingIscsiAuthWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingAccess = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingAccess) {
      this.setAccessForEdit(this.editingAccess);
    }

    this.form.controls.discovery_auth.valueChanges.subscribe((newValue) => {
      // if the user selects `Mutual CHAP`, the form will update to show all the peer controls.
      // we want to mark them as required internally to the component too.
      if (newValue === IscsiAuthMethod.ChapMutual) {
        this.form.controls.peeruser.setValidators([Validators.required]);
        this.form.controls.peersecret.addValidators([
          Validators.required,
          Validators.minLength(12),
          Validators.maxLength(16),
        ]);
        this.form.controls.peersecret_confirm.addValidators([Validators.required]);
      } else {
        // first, empty all the fields so the validators will be happy once we set them.
        this.form.patchValue({
          peeruser: '',
          peersecret: '',
          peersecret_confirm: '',
        });

        // otherwise, remove the `required` validator and reset all their values so they don't get submitted.
        // we use `setValidators` here instead of `removeValidators` so the validation re-triggers immediately.
        this.form.controls.peeruser.setValidators([]);
        this.form.controls.peersecret.setValidators([
          Validators.minLength(12),
          Validators.maxLength(16),
        ]);
        this.form.controls.peersecret_confirm.setValidators([]);

        this.form.controls.peeruser.updateValueAndValidity();
        this.form.controls.peersecret.updateValueAndValidity();
        this.form.controls.peersecret_confirm.updateValueAndValidity();
      }
    });
  }

  protected isMutualChap(): boolean {
    return this.form?.controls?.discovery_auth.value === IscsiAuthMethod.ChapMutual;
  }

  private setAccessForEdit(access: IscsiAuthAccess): void {
    this.form.patchValue({
      ...access,
      secret_confirm: access.secret,
      peersecret_confirm: access.peersecret,
    });
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();
    const payload = {
      tag: values.tag,
      user: values.user,
      secret: values.secret,
      peeruser: values.peeruser,
      peersecret: values.peersecret,
      discovery_auth: values.discovery_auth,
    } as IscsiAuthAccessUpdate;

    this.isLoading.set(true);
    const request$ = this.editingAccess
      ? this.api.call('iscsi.auth.update', [this.editingAccess.id, payload])
      : this.api.call('iscsi.auth.create', [payload]);

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
