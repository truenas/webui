import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiAuthAccess, IscsiAuthAccessUpdate } from 'app/interfaces/iscsi.interface';
import {
  doesNotEqualValidator,
  matchOtherValidator,
} from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './authorized-access-form.component.html',
  styleUrls: ['./authorized-access-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizedAccessFormComponent {
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
      this.validatorService.withMessage(
        matchOtherValidator('secret_confirm'),
        this.translate.instant('Secret and confirmation should match.'),
      ),
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
      this.validatorService.withMessage(
        doesNotEqualValidator('secret'),
        this.translate.instant('Secret and Peer Secret can not be the same.'),
      ),
      this.validatorService.withMessage(
        matchOtherValidator('peersecret_confirm'),
        this.translate.instant('Secret and confirmation should match.'),
      ),
    ]],
    peersecret_confirm: [''],
  });

  isLoading = false;

  readonly tooltips = {
    tag: helptextSharingIscsi.authaccess_tooltip_tag,
    user: helptextSharingIscsi.authaccess_tooltip_user,
    secret: helptextSharingIscsi.authaccess_tooltip_user,
    peeruser: helptextSharingIscsi.authaccess_tooltip_peeruser,
    peersecret: helptextSharingIscsi.authaccess_tooltip_peersecret,
  };

  private editingAccess: IscsiAuthAccess;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private validatorService: IxValidatorsService,
  ) {}

  isPeerUserSet(): boolean {
    return Boolean(this.form?.value?.peeruser);
  }

  setAccessForEdit(access: IscsiAuthAccess): void {
    this.editingAccess = access;
    this.form.patchValue(access);
  }

  onSubmit(): void {
    const values = this.form.value;
    delete values['secret_confirm'];
    delete values['peersecret_confirm'];

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
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
