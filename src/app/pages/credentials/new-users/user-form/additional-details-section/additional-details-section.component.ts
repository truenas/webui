import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  computed,
  effect,
  input,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  debounceTime, distinctUntilChanged, filter, map,
  Observable,
  of,
  tap,
  take,
  withLatestFrom,
} from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role, roleNames } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { isEmptyHomeDirectory } from 'app/helpers/user.helper';
import { Group } from 'app/interfaces/group.interface';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { defaultHomePath, UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  selector: 'ix-additional-details-section',
  templateUrl: './additional-details-section.component.html',
  styleUrl: './additional-details-section.component.scss',
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    MatCheckbox,
    TranslateModule,
    IxChipsComponent,
    IxExplorerComponent,
    IxPermissionsComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    EditableComponent,
    IxSelectComponent,
    TestDirective,
    ExplorerCreateDatasetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalDetailsSectionComponent implements OnInit {
  editingUser = input<User>();
  protected username = computed(() => this.userFormStore?.userConfig().username ?? '');
  protected sshAccess = this.userFormStore.sshAccess;
  protected shellAccess = this.userFormStore.shellAccess;
  protected selectedRoleName = computed(() => {
    const role = this.userFormStore.role();
    return role ? roleNames.get(role) : '';
  });

  private groupNameCache = new Map<number, string>();
  protected homeDirectoryEmptyValue = computed(() => {
    if (this.editingUser()) {
      if (isEmptyHomeDirectory(this.editingUser()?.home)) {
        return this.translate.instant('None');
      }
      return this.editingUser()?.home || '';
    }

    return this.translate.instant('Not Set');
  });

  readonly groupOptions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.id }))),
  );

  protected readonly roleGroupMap = new Map<Role, string>([
    [Role.FullAdmin, 'builtin_administrators'],
    [Role.SharingAdmin, 'truenas_sharing_administrators'],
    [Role.ReadonlyAdmin, 'truenas_readonly_administrators'],
  ]);

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  groupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[
      ['name', '^', query],
      ['local', '=', true],
    ]]).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  readonly form = this.fb.group({
    full_name: ['' as string],
    group: [null as number],
    group_create: [true],
    groups: [[] as number[]],
    email: [null as string, [emailValidator()]],
    home: [defaultHomePath],
    home_mode: ['700'],
    home_create: [false],
    default_permissions: [true],
    uid: [null as number],
    shell: [null as string | null],

    sudo_commands: [[] as string[]],
    sudo_commands_all: [false],
    sudo_commands_nopasswd: [[] as string[]],
    sudo_commands_nopasswd_all: [false],
  });

  shellOptions$: Observable<Option[]>;

  constructor(
    private storageService: StorageService,
    private filesystemService: FilesystemService,
    private fb: FormBuilder,
    private api: ApiService,
    private userFormStore: UserFormStore,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
  ) {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (values) => {
          this.userFormStore.updateUserConfig({
            group_create: values.group_create,
            home_create: values.home_create,
            full_name: values.full_name,
            groups: values.groups.map((grp) => (+grp)),
            group: values.group_create ? null : values.group,
            home: values.home,
            home_mode: this.userFormStore.homeModeOldValue() !== values.home_mode
              ? values.home_mode
              : undefined,
            email: values.email,
            uid: values.uid,
            shell: values.shell,
            sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
            sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
          });
          this.userFormStore.updateSetupDetails({
            defaultPermissions: values.default_permissions,
          });
        },
      });

    this.userFormStore.state$.pipe(
      map((state) => state.setupDetails.role),
      distinctUntilChanged(),
      withLatestFrom(this.groupOptions$),
      tap(([selectedRole, groupOptions]) => {
        if (selectedRole == null) {
          return;
        }

        groupOptions.forEach((group) => {
          this.groupNameCache.set(group.value, group.label);
        });

        const groupLabel = this.roleGroupMap.get(selectedRole);
        const groupId = groupOptions.find((group) => group.label === groupLabel)?.value;
        if (groupId) {
          this.form.patchValue({ groups: [groupId] });
        }
      }),
      untilDestroyed(this),
    ).subscribe();

    effect(() => {
      if (this.editingUser()) {
        this.setupEditUserForm(this.editingUser());
      }
    });

    effect(() => {
      if (!this.editingUser() && this.shellAccess()) {
        this.setFirstShellOption();
      }
    });
  }

  ngOnInit(): void {
    this.setupShellUpdate();
    if (!this.editingUser()) {
      if (this.shellAccess()) {
        this.setFirstShellOption();
      } else {
        this.setNoLoginShell();
      }
    }
    this.detectHomeDirectoryChanges();
    this.setHomeSharePath();
    this.listenValueChanges();
  }

  protected getPrimaryGroupName(): string {
    if (this.form.controls.group_create.value) {
      return this.translate.instant('New {username} group', { username: this.username() });
    }

    const id = this.form.controls.group.value;
    if (id) {
      return this.translate.instant('Primary Group: {groupName}', { groupName: this.groupNameCache.get(id) || String(id) });
    }

    return '';
  }

  protected getAuxGroupNames(): string[] {
    const ids = this.form.controls.groups.value || [];
    return ids.map((id) => this.groupNameCache.get(id) || String(id));
  }

  protected ensureAllGroupNames(): void {
    const ids = new Set<number>(this.form.controls.groups.value || []);
    if (!this.form.controls.group_create.value) {
      const id = this.form.controls.group.value;
      if (id) {
        ids.add(id);
      }
    }

    this.resolveGroupNames(Array.from(ids));
  }

  private resolveGroupNames(ids: number[]): void {
    const missingIds = ids.filter((groupId) => !this.groupNameCache.has(groupId));
    if (!missingIds.length) {
      return;
    }

    missingIds.forEach((missingId) => this.groupNameCache.set(missingId, ''));
    (this.api.call('group.query', [[['id', 'in', missingIds]]]) as Observable<Group[]>).pipe(
      take(1),
      tap((groups) => {
        groups.forEach((group) => {
          const name = group.group || group.name;
          this.groupNameCache.set(group.id, name);
        });
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private setupEditUserForm(user: User): void {
    const auxGroups = user.groups.filter((id) => id !== user.group?.id);

    this.form.patchValue({
      full_name: user.full_name,
      email: user.email,
      groups: auxGroups,
      home: user.home,
      uid: user.uid,
      group: user.group?.id,
      shell: user.shell,
      sudo_commands: this.form.value.sudo_commands_all ? [allCommands] : this.form.value.sudo_commands,
      sudo_commands_nopasswd: this.form.value.sudo_commands_nopasswd_all
        ? [allCommands]
        : this.form.value.sudo_commands_nopasswd,
    });

    this.form.controls.uid.disable();
    this.form.controls.group_create.patchValue(false);
    this.form.controls.group_create.disable();

    if (user.immutable) {
      this.form.controls.group.disable();
      this.form.controls.home_mode.disable();
      this.form.controls.home.disable();
      this.form.controls.home_create.disable();
    }

    if (user?.home && !isEmptyHomeDirectory(user.home)) {
      this.storageService.filesystemStat(user.home)
        .pipe(take(1), this.errorHandler.withErrorHandler(), untilDestroyed(this))
        .subscribe((stat) => {
          const homeMode = stat.mode.toString(8).substring(2, 5);
          this.form.patchValue({ home_mode: homeMode });
          this.userFormStore.updateSetupDetails({ homeModeOldValue: homeMode });
        });
    } else {
      this.form.patchValue({ home_mode: '700' });
      this.form.controls.home_mode.disable();
    }

    const ids = [...auxGroups];
    if (user.group?.id) {
      ids.push(user.group.id);
    }
    this.resolveGroupNames(ids);
  }

  private listenValueChanges(): void {
    this.form.controls.group.disabledWhile(this.form.controls.group_create.value$);
    this.form.controls.sudo_commands.disabledWhile(this.form.controls.sudo_commands_all.value$);
    this.form.controls.sudo_commands_nopasswd.disabledWhile(this.form.controls.sudo_commands_nopasswd_all.value$);

    this.form.controls.home.valueChanges.pipe(untilDestroyed(this)).subscribe((home) => {
      if (isEmptyHomeDirectory(home) || this.editingUser()?.immutable) {
        this.form.controls.home_mode.disable();
      } else {
        this.form.controls.home_mode.enable();
      }
    });

    this.form.controls.groups.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((groups) => {
      const currentRole = this.userFormStore.role();
      const requiredGroup = this.roleGroupMap.get(currentRole);
      const groupNames = groups.map((id) => this.groupNameCache.get(id));

      if (groupNames.includes('')) {
        return;
      }

      if ((requiredGroup && !groupNames.includes(requiredGroup)) || !groups.length) {
        this.userFormStore.updateSetupDetails({ role: null });
      }
    });
  }

  private setupShellUpdate(): void {
    this.form.controls.group.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((group) => {
      this.updateShellOptions(group, this.form.value.groups);
    });

    this.form.controls.groups.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((groups) => {
      this.updateShellOptions(this.form.value.group, groups);
    });

    this.userFormStore.state$.pipe(
      map((state) => state.setupDetails.allowedAccess.shellAccess),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((shellAccess) => {
      if (shellAccess) {
        this.setFirstShellOption();
      } else {
        this.setNoLoginShell();
      }
    });
  }

  private updateShellOptions(group: number, groups: number[]): void {
    const ids = new Set<number>(groups);
    if (group) {
      ids.add(group);
    }

    this.api.call('user.shell_choices', [Array.from(ids)])
      .pipe(choicesToOptions(), untilDestroyed(this))
      .subscribe((options) => {
        const filtered = options.filter((option) => !(option.value as string).includes('nologin'));
        const sorted = filtered.toSorted((a, b) => a.label.localeCompare(b.label));
        this.shellOptions$ = of(sorted);
        this.cdr.markForCheck();
      });
  }

  private setFirstShellOption(): void {
    this.api.call('user.shell_choices', [this.form.value.groups]).pipe(
      choicesToOptions(),
      filter((shells) => shells.length > 0),
      take(1),
      untilDestroyed(this),
    ).subscribe((shells) => {
      const defaultShell = (shells.find((shell) => shell.label.includes('zsh'))?.value || shells[0].value) as string;

      if (!this.form.value.shell || this.form.value.shell.includes('nologin')) {
        this.form.patchValue({ shell: defaultShell });
      }
    });
  }

  private setNoLoginShell(): void {
    this.form.patchValue({ shell: '/usr/sbin/nologin' });
  }

  private detectHomeDirectoryChanges(): void {
    this.form.controls.home.valueChanges.pipe(untilDestroyed(this)).subscribe((home) => {
      if (isEmptyHomeDirectory(home) || this.editingUser()?.immutable) {
        this.form.controls.home_mode.disable();
      } else {
        this.form.controls.home_mode.enable();
      }
    });

    this.form.controls.home_create.valueChanges.pipe(untilDestroyed(this)).subscribe((checked) => {
      if (checked) {
        this.form.patchValue({ home_mode: '700' });
      }
    });
  }

  private setHomeSharePath(): void {
    this.api.call('sharing.smb.query', [[
      ['enabled', '=', true],
      ['options.home', '=', true],
    ]]).pipe(
      filter((shares) => !!shares?.length),
      map((shares) => shares[0].path),
      untilDestroyed(this),
    ).subscribe((homeSharePath) => {
      this.form.patchValue({ home: homeSharePath });
    });
  }
}
