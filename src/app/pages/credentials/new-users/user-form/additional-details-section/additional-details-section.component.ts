import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  computed,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  debounceTime, filter, map,
  Observable,
  of,
  take,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
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
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
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
    IxSelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdditionalDetailsSectionComponent {
  protected shellAccessEnabled = this.newUserStore.shellAccess;
  protected isUsingAlternativeColors = false;

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
    email: [null as string, [emailValidator()]],
    home: [''],
    create_home_directory: [false],
    default_permissions: [true],
    uid: [null as number],
    shell: [null as string | null],
  });

  shellOptions$: Observable<Option[]> = this.api.call('user.shell_choices').pipe(
    choicesToOptions(),
    take(1),
    untilDestroyed(this),
  );

  constructor(
    private filesystemService: FilesystemService,
    private fb: FormBuilder,
    private api: ApiService,
    private newUserStore: UserFormStore,
    private cdr: ChangeDetectorRef,
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
          uid: this.form.value.uid,
        });
        this.newUserStore.updateSetupDetails({
          defaultPermissions: this.form.value.default_permissions,
        });
      },
    });

    this.setupShellUpdate();
    this.setFirstShellOption();
    this.detectFullNameChanges();
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
      this.newUserStore.updateUserConfig({ username });
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
}
