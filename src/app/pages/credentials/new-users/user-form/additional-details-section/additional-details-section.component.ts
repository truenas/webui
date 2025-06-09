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
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  debounceTime, distinctUntilChanged, filter, map,
  Observable,
  of,
  take,
} from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { isEmptyHomeDirectory } from 'app/helpers/user.helper';
import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
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
    IxIconComponent,
    IxInputComponent,
    IxCheckboxComponent,
    TranslateModule,
    TestDirective,
    IxChipsComponent,
    IxExplorerComponent,
    MatCheckbox,
    DetailsTableComponent,
    DetailsItemComponent,
    EditableComponent,
    IxSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalDetailsSectionComponent implements OnInit {
  editingUser = input<User>();
  protected shellAccessEnabled = this.userFormStore.shellAccess;
  protected hasSharingRole = computed(() => this.userFormStore.role()?.includes(Role.SharingAdmin));

  readonly groupOptions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.id }))),
  );

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  groupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['name', '^', query], ['local', '=', true]]]).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  readonly form = this.fb.group({
    full_name: ['' as string],

    group: [null as number],
    group_create: [true],
    groups: [[] as number[]],
    email: [null as string, [emailValidator()]],
    home: [''],
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
  ) {
    this.form.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
        untilDestroyed(this),
      )
      .subscribe({
        next: (values) => {
          this.userFormStore.updateUserConfig({
            group_create: values.group_create,
            home_create: values.home_create,
            full_name: values.full_name,
            groups: values.groups.map((grp) => (+grp)),
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

    effect(() => {
      if (this.editingUser()) {
        this.setupEditUserForm(this.editingUser());
      }
    });
  }

  ngOnInit(): void {
    this.setupShellUpdate();
    this.setFirstShellOption();
    this.detectFullNameChanges();
    this.detectHomeDirectoryChanges();
    this.setHomeSharePath();
    this.listenValueChanges();
  }

  private setupEditUserForm(user: User): void {
    this.form.patchValue({
      full_name: user.full_name,
      email: user.email,
      groups: user.groups,
      home: user.home,
      uid: user.uid,
      group: user.group?.id,
      shell: user.shell,
      sudo_commands: this.form.value.sudo_commands_all ? [allCommands] : this.form.value.sudo_commands,
      sudo_commands_nopasswd: this.form.value.sudo_commands_nopasswd_all
        ? [allCommands]
        : this.form.value.sudo_commands_nopasswd,
    }, { emitEvent: false });

    this.form.controls.uid.disable();
    this.form.controls.group_create.disable();

    if (user.immutable) {
      this.form.controls.group.disable();
      this.form.controls.home_mode.disable();
      this.form.controls.home.disable();
      this.form.controls.home_create.disable();
    }

    if (this.editingUser()?.home && !isEmptyHomeDirectory(this.editingUser()?.home)) {
      this.storageService.filesystemStat(this.editingUser().home)
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
  }

  private listenValueChanges(): void {
    this.form.controls.group.disabledWhile(this.form.controls.group_create.value$);
    this.form.controls.sudo_commands.disabledWhile(this.form.controls.sudo_commands_all.value$);
    this.form.controls.sudo_commands_nopasswd.disabledWhile(this.form.controls.sudo_commands_nopasswd_all.value$);
  }

  private setupShellUpdate(): void {
    this.form.controls.group.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((group) => {
      this.updateShellOptions(group, this.form.value.groups);
    });

    this.form.controls.groups.valueChanges.pipe(debounceTime(300), untilDestroyed(this)).subscribe((groups) => {
      this.updateShellOptions(this.form.value.group, groups);
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
        this.shellOptions$ = of(options);
        this.cdr.markForCheck();
      });
  }

  private setFirstShellOption(): void {
    this.api.call('user.shell_choices', [this.form.value.groups]).pipe(
      choicesToOptions(),
      filter((shells) => !!shells.length),
      map((shells) => shells[0].value),
      untilDestroyed(this),
    ).subscribe((firstShell: string) => {
      this.form.patchValue({ shell: firstShell });
    });
  }

  private detectFullNameChanges(): void {
    this.form.controls.full_name.valueChanges.pipe(
      map((fullName) => this.getUserName(fullName)),
      filter((username) => !!username),
      untilDestroyed(this),
    ).subscribe((username) => {
      this.userFormStore.updateUserConfig({ username });
    });
  }

  private getUserName(fullName: string): string {
    let username: string;
    const formatted = fullName.trim().split(/[\s,]+/);
    if (formatted.length === 1) {
      username = formatted[0];
    } else {
      username = formatted[0][0] + formatted.pop();
    }
    if (username.length >= 8) {
      username = username.substring(0, 8);
    }

    return username.toLocaleLowerCase();
  }

  private detectHomeDirectoryChanges(): void {
    this.form.controls.home.valueChanges.pipe(untilDestroyed(this)).subscribe((home) => {
      if (isEmptyHomeDirectory(home) || this.editingUser().immutable) {
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
      ['home', '=', true],
    ]]).pipe(
      filter((shares) => !!shares?.length),
      map((shares) => shares[0].path),
      untilDestroyed(this),
    ).subscribe((homeSharePath) => {
      this.form.patchValue({ home: homeSharePath });
    });
  }
}
