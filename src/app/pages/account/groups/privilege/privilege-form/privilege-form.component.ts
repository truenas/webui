import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { Role, roleNames } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
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
  localGroups: Group[] = [];
  dsGroups: Group[] = [];

  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
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
    map((roles) => roles.map((role) => ({ label: roleNames.get(role.name) || role.title, value: role.name }))),
  );

  readonly localGroupsProvider: ChipsProvider = (query: string) => {
    return this.ws.call('group.query', [[['local', '=', true]]]).pipe(
      map((groups) => {
        this.localGroups = groups;
        const chips = groups.map((group) => group.group);
        return chips.filter((item) => item.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

  readonly dsGroupsProvider: ChipsProvider = (query: string) => {
    return this.ws.call('group.query', [[['local', '=', false]], { extra: { search_dscache: true } }]).pipe(
      map((groups) => {
        this.dsGroups = groups;
        const chips = groups.map((group) => group.group);
        return chips.filter((item) => item.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

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
      local_groups: this.existingPrivilege.local_groups.map((group) => group.group),
      ds_groups: this.existingPrivilege.ds_groups.map((group) => group.group),
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values: PrivilegeUpdate = {
      ...this.form.value,
      local_groups: this.localGroupsUids,
      ds_groups: this.dsGroupsUids,
    };

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

  private get localGroupsUids(): number[] {
    return this.localGroups
      .filter((group) => this.form.value.local_groups.includes(group.group))
      .map((group) => group.gid);
  }

  private get dsGroupsUids(): number[] {
    return this.dsGroups
      .filter((group) => this.form.value.ds_groups.includes(group.group))
      .map((group) => group.gid);
  }
}
