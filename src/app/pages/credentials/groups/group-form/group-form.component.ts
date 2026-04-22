import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, combineLatest, of, shareReplay } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { helptextGroups } from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { groupAdded, groupChanged } from 'app/pages/credentials/groups/store/group.actions';
import { GroupSlice } from 'app/pages/credentials/groups/store/group.selectors';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'ix-group-form',
  templateUrl: './group-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class GroupFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<GroupSlice>>(Store);
  private slideInRef = inject<SlideInRef<Group | undefined, boolean>>(SlideInRef);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AccountWrite];

  protected editingGroup = this.slideInRef.getData();

  protected formSnapshot = signal<Record<string, unknown> | null>(null);
  protected initialLoading = signal(false);

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
    gid: helptextGroups.groupIdTooltip,
    name: helptextGroups.nameTooltip,
    privileges: helptextGroups.privilegesTooltip,
    sudo: helptextGroups.sudoTooltip,
    smb: helptextGroups.smbTooltip,
  };

  private readonly privileges = signal<Privilege[]>([]);

  protected readonly privilegeOptions$ = this.api.call('privilege.query').pipe(
    map((privileges) => {
      this.privileges.set(privileges);

      const initialPrivileges = privileges.filter((privilege) => {
        return this.editingGroup?.gid
          && privilege.local_groups.map((group) => group.gid).includes(this.editingGroup?.gid);
      });

      if (initialPrivileges.length > 0) {
        this.form.controls.privileges.patchValue(
          initialPrivileges.map((privilege) => privilege.id),
        );
      }

      if (this.editingGroup) {
        this.formSnapshot.set(this.form.getRawValue() as Record<string, unknown>);
      }

      return privileges.map((privilege) => ({ label: privilege.name, value: privilege.id }));
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly initialGroupRelatedPrivileges = computed(() => {
    return this.privileges().filter((privilege) => {
      return this.editingGroup?.gid
        && privilege.local_groups.map((group) => group.gid).includes(this.editingGroup?.gid);
    });
  });

  ngOnInit(): void {
    this.setupForm();
    this.initialLoading.set(true);
    this.privilegeOptions$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      complete: () => this.initialLoading.set(false),
      error: () => this.initialLoading.set(false),
    });
  }

  protected readonly privilegesProvider: ChipsProvider = (query: string) => {
    return this.privilegeOptions$.pipe(
      map((options) => {
        return options
          .map((option) => option.label)
          .filter((label) => label.trim().toLowerCase().includes(query.trim().toLowerCase()));
      }),
    );
  };

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    // Uses the full form value instead of event.changedValues because sudo_commands
    // and sudo_commands_nopasswd are derived from their `_all` toggles; sending a
    // partial update based on which individual field changed would drop that pairing.
    const values = this.form.getRawValue();
    const commonBody = {
      name: values.name,
      smb: values.smb,
      sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
      sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
    };

    const request$ = (this.editingGroup
      ? this.api.call('group.update', [this.editingGroup.id, commonBody])
      : this.api.call('group.create', [{ ...commonBody, gid: values.gid as number }])
    ).pipe(
      switchMap((id) => this.api.call('group.query', [[['id', '=', id]]])),
      map((groups) => groups[0]),
      switchMap((group) => this.togglePrivilegesForGroup(group.gid).pipe(map(() => group))),
    );

    return {
      request$,
      successMessage: event.isEdit
        ? this.translate.instant('Group updated')
        : this.translate.instant('Group added'),
      onSuccess: (result: unknown) => {
        const group = result as Group;
        const roles = this.privileges()
          .filter((privilege) => this.form.getRawValue().privileges.some((id) => id === privilege.id))
          .map((role) => role.builtin_name) as Role[];

        if (event.isEdit) {
          this.store$.dispatch(groupChanged({ group: { ...group, roles } }));
        } else {
          this.store$.dispatch(groupAdded({ group: { ...group, roles } }));
        }
      },
    };
  };

  protected setupForm(): void {
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
      this.api.call('group.get_next_gid').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((nextId) => {
        this.form.patchValue({ gid: nextId });
      });
      this.setNamesInUseValidator();
    }
  }

  private togglePrivilegesForGroup(groupId: number): Observable<Privilege[]> {
    const requests$: Observable<Privilege>[] = [];

    const priviliges = this.form.value.privileges;
    if (priviliges) {
      const privileges = this.privileges()
        .filter((privilege) => priviliges.some((privilegeId) => privilege.id === privilegeId));

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

    if (this.existingPrivilegesRemoved.length > 0) {
      const privileges = this.privileges()
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

  private setNamesInUseValidator(currentName?: string): void {
    this.api.call('group.query').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((groups) => {
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
      ds_groups: privilege.ds_groups.map((group) => group.gid),
      name: privilege.name,
      roles: privilege.roles,
      web_shell: privilege.web_shell,
    };
  }

  private setFormRelations(): void {
    this.form.controls.sudo_commands_all.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands.disable();
      } else {
        this.form.controls.sudo_commands.enable();
      }
    });

    this.form.controls.sudo_commands_nopasswd_all.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isAll) => {
      if (isAll) {
        this.form.controls.sudo_commands_nopasswd.disable();
      } else {
        this.form.controls.sudo_commands_nopasswd.enable();
      }
    });
  }

  private get existingPrivilegesRemoved(): number[] {
    return Array.from(new Set(
      this.initialGroupRelatedPrivileges()
        .filter((privilege) => !this.form.getRawValue().privileges.includes(privilege.id as never))
        .map((privilege) => privilege.id),
    ));
  }

  protected readonly ignoreTranslation = ignoreTranslation;
}
