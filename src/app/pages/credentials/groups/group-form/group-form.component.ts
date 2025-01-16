import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Observable, combineLatest, of,
} from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { allCommands } from 'app/constants/all-commands.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextGroups } from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { groupAdded, groupChanged } from 'app/pages/credentials/groups/store/group.actions';
import { GroupSlice } from 'app/pages/credentials/groups/store/group.selectors';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-group-form',
  templateUrl: './group-form.component.html',
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
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class GroupFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.AccountWrite];

  get isNew(): boolean {
    return !this.editingGroup;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add Group') : this.translate.instant('Edit Group');
  }

  isFormLoading = false;

  privilegesList: Privilege[];
  initialGroupRelatedPrivilegesList: Privilege[] = [];
  protected editingGroup: Group | undefined;

  form = this.fb.group({
    gid: [null as number | null, [Validators.required, Validators.pattern(/^\d+$/)]],
    name: ['', [Validators.required, Validators.pattern(UserService.namePattern)]],
    sudo_commands: [[] as string[]],
    sudo_commands_all: [false],
    sudo_commands_nopasswd: [[] as string[]],
    sudo_commands_nopasswd_all: [false],
    smb: [false],
    privileges: [[] as string[] | number[]],
  });

  readonly tooltips = {
    gid: helptextGroups.bsdgrp_gid_tooltip,
    name: helptextGroups.bsdgrp_group_tooltip,
    privileges: helptextGroups.privileges_tooltip,
    sudo: helptextGroups.bsdgrp_sudo_tooltip,
    smb: helptextGroups.smb_tooltip,
  };

  readonly privilegeOptions$ = this.api.call('privilege.query').pipe(
    map((privileges) => privileges.map((privilege) => ({ label: privilege.name, value: privilege.id }))),
  );

  constructor(
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private store$: Store<GroupSlice>,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<Group | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingGroup = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.setupForm();
    this.getPrivilegesList();
  }

  readonly privilegesProvider: ChipsProvider = (query: string) => {
    return this.api.call('privilege.query', []).pipe(
      map((privileges) => {
        const chips = privileges.map((privilege) => privilege.name);
        return chips.filter((item) => item.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

  setupForm(): void {
    this.setFormRelations();

    if (this.editingGroup) {
      this.form.controls.gid.disable();
      this.form.patchValue({
        gid: this.editingGroup.gid,
        name: this.editingGroup.group,
        sudo_commands: this.editingGroup.sudo_commands?.includes(allCommands) ? [] : this.editingGroup.sudo_commands,
        sudo_commands_all: !!this.editingGroup.sudo_commands?.includes(allCommands),
        sudo_commands_nopasswd: this.editingGroup.sudo_commands_nopasswd?.includes(allCommands)
          ? []
          : this.editingGroup.sudo_commands_nopasswd,
        sudo_commands_nopasswd_all: this.editingGroup.sudo_commands_nopasswd?.includes(allCommands),
        smb: this.editingGroup.smb,
      });
      this.setNamesInUseValidator(this.editingGroup.group);
    } else {
      this.api.call('group.get_next_gid').pipe(untilDestroyed(this)).subscribe((nextId) => {
        this.form.patchValue({
          gid: nextId,
        });
        this.cdr.markForCheck();
      });
      this.setNamesInUseValidator();
    }
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      name: values.name,
      smb: values.smb,
      sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
      sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.editingGroup) {
      request$ = this.api.call('group.update', [
        this.editingGroup.id,
        commonBody,
      ]);
    } else {
      request$ = this.api.call('group.create', [{
        ...commonBody,
        gid: values.gid,
      }]);
    }

    request$.pipe(
      switchMap((id) => this.api.call('group.query', [[['id', '=', id]]])),
      map((groups) => groups[0]),
      switchMap((group) => this.togglePrivilegesForGroup(group.gid).pipe(map(() => group))),
      untilDestroyed(this),
    ).subscribe({
      next: (group) => {
        const roles = this.privilegesList
          .filter((privilege) => this.form.getRawValue().privileges.some((id) => id === privilege.id))
          .map((role) => role.builtin_name) as Role[];

        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Group added'));
          this.store$.dispatch(groupAdded({ group: { ...group, roles } }));
        } else {
          this.snackbar.success(this.translate.instant('Group updated'));
          this.store$.dispatch(groupChanged({ group: { ...group, roles } }));
        }

        this.isFormLoading = false;
        this.slideInRef.close({ response: true, error: null });
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private togglePrivilegesForGroup(groupId: number): Observable<Privilege[]> {
    const requests$: Observable<Privilege>[] = [];

    if (this.form.value.privileges) {
      const privileges = this.privilegesList
        .filter((privilege) => this.form.value.privileges.some((privilegeId) => privilege.id === privilegeId));

      privileges.forEach((privilege) => {
        requests$.push(
          this.api.call('privilege.update', [
            privilege.id,
            this.mapPrivilegeToPrivilegeUpdate(
              privilege,
              Array.from(new Set([...privilege.local_groups.map((group) => group.gid), groupId])),
            ),
          ]),
        );
      });
    }

    if (this.existingPrivilegesRemoved) {
      const privileges = this.privilegesList
        .filter((privilege) => this.existingPrivilegesRemoved.some((privilegeId) => privilege.id === privilegeId));

      privileges.forEach((privilege) => {
        requests$.push(
          this.api.call('privilege.update', [
            privilege.id,
            this.mapPrivilegeToPrivilegeUpdate(
              privilege,
              privilege.local_groups.map((group) => group.gid).filter((gid) => gid !== groupId),
            ),
          ]),
        );
      });
    }

    return requests$.length ? combineLatest(requests$) : of([]);
  }

  private getPrivilegesList(): void {
    this.api.call('privilege.query', [])
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((privileges) => {
        this.initialGroupRelatedPrivilegesList = privileges.filter((privilege) => {
          return privilege.local_groups.map((group) => group.gid).includes(this.editingGroup?.gid);
        });

        this.privilegesList = privileges;

        this.form.controls.privileges.patchValue(
          this.initialGroupRelatedPrivilegesList.map((privilege) => privilege.id),
        );
      });
  }

  private setNamesInUseValidator(currentName?: string): void {
    this.api.call('group.query').pipe(untilDestroyed(this)).subscribe((groups) => {
      let forbiddenNames = groups.map((group) => group.group);
      if (currentName) {
        forbiddenNames = forbiddenNames.filter((name) => name !== currentName);
      }
      this.form.controls.name.addValidators(forbiddenValues(forbiddenNames));
    });
  }

  private mapPrivilegeToPrivilegeUpdate(privilege: Privilege, localGroups: number[]): PrivilegeUpdate {
    return {
      local_groups: localGroups,
      ds_groups: [...privilege.ds_groups.map((group) => group.gid)],
      name: privilege.name,
      roles: privilege.roles,
      web_shell: privilege.web_shell,
    };
  }

  private setFormRelations(): void {
    this.form.controls.sudo_commands_all.valueChanges.pipe(untilDestroyed(this)).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands.disable();
      } else {
        this.form.controls.sudo_commands.enable();
      }
    });

    this.form.controls.sudo_commands_nopasswd_all.valueChanges.pipe(untilDestroyed(this)).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands_nopasswd.disable();
      } else {
        this.form.controls.sudo_commands_nopasswd.enable();
      }
    });
  }

  private get existingPrivilegesRemoved(): number[] {
    return Array.from(new Set(
      this.initialGroupRelatedPrivilegesList
        .filter((privilege) => !this.form.getRawValue().privileges.includes(privilege.id as never))
        .map((privileges) => privileges.id),
    ));
  }
}
