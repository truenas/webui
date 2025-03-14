import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { tooltips } from '@codemirror/view';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
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
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/new-user-form/allowed-access-section/allowed-access-section.component';
import { AuthSectionComponent } from 'app/pages/credentials/users/new-user-form/auth-section/auth-section.component';
import { AllowAccessConfig } from 'app/pages/credentials/users/new-user-form/interfaces/allow-access-config.interface';
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
    AllowedAccessSectionComponent,
    MatButton,
    TestDirective,
    IxIconComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxExplorerComponent,
    AuthSectionComponent,
    MatCheckbox,
  ],
})
export class NewUserFormComponent {
  protected allowedAccessConfig = signal<AllowAccessConfig>({
    smbAccess: true,
    truenasAccess: {
      enabled: true,
      role: 'prompt',
    },
    sshAccess: false,
    shellAccess: false,
  });

  protected form = this.formBuilder.group({
    username: ['', [
      Validators.required,
      Validators.pattern(UserService.namePattern),
      Validators.maxLength(32),
    ]],
    full_name: [''],

    groups: [[]],
    create_group: [true],

    home: [''],
    create_home_directory: [false],
    default_permissions: [true],
  });

  protected isEditingGroups = false;
  protected isEditingHomeDirectory = false;
  protected isEditingFullName = false;

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  groupsProvider: ChipsProvider = (query: string) => {
    return this.api.call('group.query', [[['name', '^', query], ['local', '=', true]]]).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  protected readonly fakeTooltip = '';

  readonly groupOptions$ = this.api.call('group.query', [[['local', '=', true]]]).pipe(
    map((groups) => groups.map((group) => ({ label: group.group, value: group.id }))),
  );

  protected setAllowAccessConfig(config: AllowAccessConfig): void {
    this.allowedAccessConfig.set(config);
  }

  protected isUsingAlternativeColors = false;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private api: ApiService,
    private filesystemService: FilesystemService,
    public slideInRef: SlideInRef<User | undefined, boolean>,
  ) { }

  protected get hasSharingRole(): boolean {
    return this.allowedAccessConfig().truenasAccess?.role.includes(Role.SharingAdmin);
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
