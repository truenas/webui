import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiAuthAccess, IscsiAuthAccessUpdate } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import {
  doesNotEqualFgValidator,
  matchOthersFgValidator,
} from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-authorized-access-form',
  templateUrl: './authorized-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class AuthorizedAccessFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingAccess;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Authorized Access')
      : this.translate.instant('Edit Authorized Access');
  }

  form = this.formBuilder.group({
    tag: [null as number, [Validators.required, Validators.min(0)]],
    user: ['', Validators.required],
    secret: ['', [
      Validators.minLength(12),
      Validators.maxLength(16),
      Validators.required,
    ]],
    secret_confirm: ['', Validators.required],
    peeruser: [''],
    peersecret: ['', [
      this.validatorService.validateOnCondition(
        () => this.isPeerUserSet(),
        Validators.required,
      ),
      Validators.minLength(12),
      Validators.maxLength(16),
    ]],
    peersecret_confirm: [''],
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
        this.translate.instant('Secret and Peer Secret can not be the same.'),
      ),
    ],
  });

  isLoading = false;

  readonly tooltips = {
    tag: helptextSharingIscsi.authaccess_tooltip_tag,
    user: helptextSharingIscsi.authaccess_tooltip_user,
    secret: helptextSharingIscsi.authaccess_tooltip_user,
    peeruser: helptextSharingIscsi.authaccess_tooltip_peeruser,
    peersecret: helptextSharingIscsi.authaccess_tooltip_peersecret,
  };

  readonly requiredRoles = [
    Role.SharingIscsiAuthWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private validatorService: IxValidatorsService,
    private slideInRef: SlideInRef<AuthorizedAccessFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingAccess: IscsiAuthAccess,
  ) {}

  ngOnInit(): void {
    if (this.editingAccess) {
      this.setAccessForEdit();
    }
  }

  isPeerUserSet(): boolean {
    return Boolean(this.form?.value?.peeruser);
  }

  setAccessForEdit(): void {
    this.form.patchValue(this.editingAccess);
  }

  onSubmit(): void {
    const values = this.form.value;
    delete values.secret_confirm;
    delete values.peersecret_confirm;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.auth.create', [values as IscsiAuthAccessUpdate]);
    } else {
      request$ = this.ws.call('iscsi.auth.update', [
        this.editingAccess.id,
        values as IscsiAuthAccessUpdate,
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
