import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, Inject,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Jbof, JbofUpdate } from 'app/interfaces/jbof.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipv4Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: 'jbof-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JbosFormComponent implements OnInit {
  protected requiredRoles = [Role.JbofWrite];

  isFormLoading = false;

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
      ? this.translate.instant('Add Expansion Shelve')
      : this.translate.instant('Edit Expansion Shelve');
  }

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<JbosFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingJbof: Jbof,
  ) {}

  ngOnInit(): void {
    if (this.editingJbof) {
      this.setJbofForEdit();
    }
  }

  setJbofForEdit(): void {
    if (!this.isNew) {
      this.form.patchValue(this.editingJbof);
    }
  }

  onSubmit(): void {
    const values = this.form.value as JbofUpdate;

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('jbof.create', [values]);
    } else {
      request$ = this.ws.call('jbof.update', [this.editingJbof.id, values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
