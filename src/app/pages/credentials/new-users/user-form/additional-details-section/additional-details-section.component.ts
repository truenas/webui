import {
  ChangeDetectionStrategy, Component,
  computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Option } from 'app/interfaces/option.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalDetailsSectionComponent {
  protected shellAccessEnabled = this.newUserStore.shellAccess;
  protected isUsingAlternativeColors = false;

  fakeTooltip = '';

  protected hasSharingRole = computed(() => this.newUserStore.role()?.includes(Role.SharingAdmin));

  protected isEditingGroups = false;
  protected isEditingHomeDirectory = false;
  protected isEditingFullName = false;

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
    full_name: [''],

    group: [null as number],
    create_group: [true],
    groups: [[] as number[]],
    email: [null as string],
    home: [''],
    create_home_directory: [false],
    default_permissions: [true],
    uid: [null as number],
    shell: new FormControl(null as string | null),
  });

  shellOptions$: Observable<Option[]>;

  constructor(
    private filesystemService: FilesystemService,
    private fb: FormBuilder,
    private api: ApiService,
    private newUserStore: UserFormStore,
  ) {
    this.form.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.newUserStore.updateUserConfig({
          group_create: this.form.value.create_group,
          home_create: this.form.value.create_home_directory,
          full_name: this.form.value.full_name,
          groups: this.form.value.groups.map((grp) => (+grp)),
          home: this.form.value.home,
          email: this.form.value.email,
        });
        this.newUserStore.updateSetupDetails({
          defaultPermissions: this.form.value.default_permissions,
        });
      },
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
}
