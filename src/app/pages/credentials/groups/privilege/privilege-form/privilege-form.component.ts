import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role, roleNames } from 'app/enums/role.enum';
import { helptextPrivilege } from 'app/helptext/account/priviledge';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-privilege-form',
  templateUrl: './privilege-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class PrivilegeFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  protected isLoading = false;
  protected localGroups: Group[] = [];
  protected dsGroups: Group[] = [];

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    local_groups: [[] as string[]],
    ds_groups: [[] as string[]],
    web_shell: [false],
    roles: [[] as Role[]],
  });

  protected readonly helptext = helptextPrivilege;

  get isNew(): boolean {
    return !this.existingPrivilege;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('New Privilege')
      : this.translate.instant('Edit Privilege');
  }

  readonly rolesOptions$ = this.ws.call('privilege.roles').pipe(
    map((roles) => {
      const sortedRoles = roles.toSorted((a, b) => {
        // Show compound roles first, then sort by name.
        if (a.builtin === b.builtin) {
          return a.name.localeCompare(b.name);
        }

        return a.builtin ? 1 : -1;
      });

      return sortedRoles.map((role) => ({
        label: roleNames.has(role.name) ? this.translate.instant(roleNames.get(role.name)) : role.name,
        value: role.name,
      }));
    }),
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
    return this.ws.call('group.query', [[['local', '=', false]]]).pipe(
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
    private slideInRef: SlideInRef<PrivilegeFormComponent>,
    @Inject(SLIDE_IN_DATA) private existingPrivilege: Privilege,
  ) { }

  ngOnInit(): void {
    if (this.existingPrivilege) {
      this.setPrivilegeForEdit();
      if (this.existingPrivilege.builtin_name) {
        this.form.controls.name.disable();
        this.form.controls.roles.disable();
      }
    }
  }

  setPrivilegeForEdit(): void {
    this.form.patchValue({
      ...this.existingPrivilege,
      local_groups: this.existingPrivilege.local_groups.map(
        (group) => group.group || this.translate.instant('Missing group - {gid}', { gid: group.gid }),
      ),
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
      error: (error: unknown) => {
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
