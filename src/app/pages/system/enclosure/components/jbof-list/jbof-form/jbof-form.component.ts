import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Jbof, JbofUpdate } from 'app/interfaces/jbof.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-jbof-form',
  templateUrl: 'jbof-form.component.html',
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
export class JbofFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.JbofWrite];

  isFormLoading = false;
  protected editingJbof: Jbof | undefined;

  form = this.fb.group({
    description: ['', [Validators.required]],
    mgmt_ip1: ['', [Validators.required, ipv4Validator()]],
    mgmt_ip2: ['', [ipv4Validator()]],
    mgmt_username: ['', [Validators.required]],
    mgmt_password: ['', [Validators.required]],
  });

  get isNew(): boolean {
    return !this.editingJbof;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Expansion Shelf')
      : this.translate.instant('Edit Expansion Shelf');
  }

  constructor(
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    public slideInRef: SlideInRef<Jbof | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingJbof = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingJbof) {
      this.form.patchValue(this.editingJbof);
    }
  }

  onSubmit(): void {
    const values = this.form.value as JbofUpdate;

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.api.call('jbof.create', [values]);
    } else {
      request$ = this.api.call('jbof.update', [this.editingJbof.id, values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
