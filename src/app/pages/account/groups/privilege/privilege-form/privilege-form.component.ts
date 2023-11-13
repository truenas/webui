import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Privilege } from 'app/interfaces/privilege.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivilegeFormComponent implements OnInit {
  isLoading = false;

  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as number[]],
    ds_groups: [[] as number[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  get isNew(): boolean {
    return !this.existingPrivilege;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('New Privilege')
      : this.translate.instant('Edit Privilege');
  }

  readonly rolesOptions$ = this.ws.call('privilege.roles').pipe(
    map((roles) => roles.map((role) =>({ label: role.title, value: role.name }))),
  );

  readonly localGroupsOptions$ = this.ws.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.gid }))),
  );

  readonly dsGroupsOptions$ = this.ws.call('group.query', [[['local', '=', false]], { extra: { search_dscache: true } }]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.gid }))),
  );

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: IxSlideInRef<PrivilegeFormComponent>,
    @Inject(SLIDE_IN_DATA) private existingPrivilege: Privilege,
  ) { }

  ngOnInit(): void {
    if (this.existingPrivilege) {
      this.setPrivilegeForEdit();
    }
  }

  setPrivilegeForEdit(): void {
    this.form.patchValue({
      ...this.existingPrivilege,
      local_groups: this.existingPrivilege.local_groups.map((group) => group.gid),
      ds_groups: this.existingPrivilege.ds_groups.map((group) => group.gid),
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isLoading = true;
    let request$: Observable<Privilege>;
    if (this.isNew) {
      request$ = this.ws.call('privilege.create', [values]);
    } else {
      request$ = this.ws.call('privilege.update', [this.existingPrivilege.id, values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
