import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { tooltips } from '@codemirror/view';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-new-user-form',
  templateUrl: './new-user-form.component.html',
  styleUrls: ['./new-user-form.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    IxIconComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxTextareaComponent,
    IxChipsComponent,
    IxExplorerComponent,
    MatCheckbox,
  ],
})
export class NewUserFormComponent {
  protected form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
    full_name: [''],

    smb_access: [true],
    truenas_access: [false],
    ssh_access: [false],
    shell_access: [false],

    password: [''],
    disable_password: [false],
    allow_ssh_login_with_password: [false],
    ssh_key: [''],

    role: ['prompt'],

    groups: [[]],
    create_group: [true],

    home: [''],
    create_home_directory: [false],
    default_permissions: [true],
  });

  protected readonly fakeTooltip = '';

  protected isEditingGroups = false;
  protected isEditingHomeDirectory = false;
  protected isEditingFullName = false;

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  groupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['name', '^', query], ['local', '=', true]]]).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  readonly groupOptions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.id }))),
  );

  protected readonly roles$ = of([
    { label: 'Select Role', value: 'prompt' },
    { label: 'Full Admin', value: Role.FullAdmin },
    { label: 'Sharing Admin', value: Role.SharingAdmin },
    { label: 'Readonly Admin', value: Role.ReadonlyAdmin },
  ]);

  protected isUsingAlternativeColors = false;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private api: ApiService,
    private filesystemService: FilesystemService,
    public slideInRef: SlideInRef<User | undefined, boolean>,
  ) {
    this.setDemoRelations();
  }

  protected get hasSharingRole(): boolean {
    return this.form.value.truenas_access && this.form.value.role.includes(Role.SharingAdmin);
  }

  protected setDemoRelations(): void {
    this.form.controls.disable_password.disable();
    this.form.controls.smb_access.valueChanges.pipe(untilDestroyed(this)).subscribe((hasSmbAccess) => {
      if (hasSmbAccess) {
        this.form.controls.disable_password.disable();
      } else {
        this.form.controls.disable_password.enable();
      }
    });

    this.form.controls.ssh_access.valueChanges.pipe(untilDestroyed(this)).subscribe((hasSshAccess) => {
      if (hasSshAccess) {
        this.form.controls.shell_access.disable();
        this.form.controls.shell_access.setValue(true);
      } else {
        this.form.controls.shell_access.enable();
      }
    });
  }

  protected onCloseInlineEdits(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.extra-controls-container')) {
      return;
    }

    this.isEditingFullName = false;
    this.isEditingGroups = false;
    this.isEditingHomeDirectory = false;
  }

  protected onEditFullName(): void {
    this.isEditingFullName = true;
    this.isEditingGroups = false;
    this.isEditingHomeDirectory = false;
  }

  protected onEditGroups(): void {
    this.isEditingGroups = true;
    this.isEditingFullName = false;
    this.isEditingHomeDirectory = false;
  }

  protected onEditHomeDirectory(): void {
    this.isEditingFullName = false;
    this.isEditingHomeDirectory = true;
    this.isEditingGroups = false;
  }

  protected onSubmit(): void {}

  protected readonly tooltips = tooltips;
  protected readonly Role = Role;
}
