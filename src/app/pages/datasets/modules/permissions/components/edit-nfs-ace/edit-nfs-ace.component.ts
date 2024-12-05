import {
  ChangeDetectionStrategy, Component, input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { fromPairs } from 'lodash-es';
import { of } from 'rxjs';
import {
  NfsAclTag, nfsAclTagLabels, NfsAclType,
  nfsAclTypeLabels, NfsAdvancedFlag, nfsAdvancedFlagLabels,
  NfsAdvancedPermission, nfsAdvancedPermissionLabels,
  NfsBasicFlag, nfsBasicFlagLabels, nfsBasicPermissionLabels,
} from 'app/enums/nfs-acl.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import {
  AdvancedNfsFlags,
  AdvancedNfsPermissions,
  areNfsFlagsBasic,
  areNfsPermissionsBasic,
  BasicNfsFlags,
  BasicNfsPermissions,
  NfsAclItem,
} from 'app/interfaces/acl.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxCheckboxListComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { newNfsAce } from 'app/pages/datasets/modules/permissions/utils/new-ace.utils';
import { UserService } from 'app/services/user.service';
import {
  NfsFormFlagsType,
  nfsFormFlagsTypeLabels,
  NfsFormPermsType,
  nfsFormPermsTypeLabels,
} from './edit-nfs-ace-form.types';

@UntilDestroy()
@Component({
  selector: 'ix-edit-nfs-ace',
  templateUrl: './edit-nfs-ace.component.html',
  styleUrls: ['./edit-nfs-ace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxRadioGroupComponent,
    IxCheckboxListComponent,
    TranslateModule,
  ],
})
export class EditNfsAceComponent implements OnChanges, OnInit {
  readonly ace = input<NfsAclItem>();

  form = this.formBuilder.group({
    tag: [NfsAclTag.User as NfsAclTag],
    user: [null as string],
    group: [null as string],
    type: [NfsAclType.Allow],
    permissionType: [NfsFormPermsType.Basic],
    basicPermission: [newNfsAce.perms.BASIC],
    advancedPermissions: [[] as NfsAdvancedPermission[]],
    flagsType: [NfsFormFlagsType.Basic],
    basicFlag: [NfsBasicFlag.Inherit],
    advancedFlags: [[] as NfsAdvancedFlag[]],
  });

  readonly tags$ = of(mapToOptions(nfsAclTagLabels, this.translate));
  readonly aclTypes$ = of(mapToOptions(nfsAclTypeLabels, this.translate));
  readonly permissionTypes$ = of(mapToOptions(nfsFormPermsTypeLabels, this.translate));
  readonly basicPermissions$ = of(mapToOptions(nfsBasicPermissionLabels, this.translate));
  readonly advancedPermissions$ = of(mapToOptions(nfsAdvancedPermissionLabels, this.translate));
  readonly flagTypes$ = of(mapToOptions(nfsFormFlagsTypeLabels, this.translate));
  readonly basicFlags$ = of(mapToOptions(nfsBasicFlagLabels, this.translate));
  readonly advancedFlags$ = of(mapToOptions(nfsAdvancedFlagLabels, this.translate));

  readonly tooltips = {
    tag: helptextAcl.dataset_acl_tag_tooltip,
    user: helptextAcl.dataset_acl_user_tooltip,
    group: helptextAcl.dataset_acl_group_tooltip,
    type: helptextAcl.dataset_acl_type_tooltip,
    permissionType: helptextAcl.dataset_acl_perms_type_tooltip,
    basicPermission: helptextAcl.dataset_acl_perms_tooltip,
    advancedPermissions: helptextAcl.dataset_acl_perms_tooltip,
    flagsType: helptextAcl.dataset_acl_flags_type_tooltip,
    basicFlag: helptextAcl.dataset_acl_flags_tooltip,
    advancedFlags: helptextAcl.dataset_acl_flags_tooltip,
  };

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly groupProvider = new GroupComboboxProvider(this.userService);

  constructor(
    private formBuilder: FormBuilder,
    private store: DatasetAclEditorStore,
    private userService: UserService,
    private translate: TranslateService,
  ) {}

  get isUserTag(): boolean {
    return this.form.value.tag === NfsAclTag.User;
  }

  get isGroupTag(): boolean {
    return this.form.value.tag === NfsAclTag.UserGroup;
  }

  get arePermissionsBasic(): boolean {
    return this.form.value.permissionType === NfsFormPermsType.Basic;
  }

  get areFlagsBasic(): boolean {
    return this.form.value.flagsType === NfsFormFlagsType.Basic;
  }

  ngOnChanges(): void {
    this.updateFormValues();
  }

  ngOnInit(): void {
    this.setFormListeners();
    this.updateFormValues();
  }

  private setFormListeners(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onAceUpdated());
    this.form.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onFormStatusUpdated());
  }

  private onFormStatusUpdated(): void {
    this.store.updateSelectedAceValidation(this.form.valid);
  }

  private onAceUpdated(): void {
    const updatedAce = this.formValuesToAce();

    this.store.updateSelectedAce(updatedAce);
  }

  private formValuesToAce(): NfsAclItem {
    const formValues = this.form.value;

    const ace = {
      tag: formValues.tag,
      type: formValues.type,
    } as NfsAclItem;

    if (this.isUserTag) {
      ace.who = formValues.user;
    } else if (this.isGroupTag) {
      ace.who = formValues.group;
    }

    if (formValues.permissionType === NfsFormPermsType.Basic) {
      if (!formValues.basicPermission) {
        ace.perms = { BASIC: newNfsAce.perms.BASIC };
      } else {
        ace.perms = { BASIC: formValues.basicPermission } as BasicNfsPermissions;
      }
    } else if (Array.isArray(formValues.advancedPermissions)) {
      ace.perms = fromPairs(formValues.advancedPermissions.map((key) => [key, true])) as AdvancedNfsPermissions;
    }

    if (formValues.flagsType === NfsFormFlagsType.Basic) {
      if (!formValues.basicFlag) {
        ace.flags = { BASIC: newNfsAce.flags.BASIC };
      } else {
        ace.flags = { BASIC: formValues.basicFlag } as BasicNfsFlags;
      }
    } else if (Array.isArray(formValues.advancedFlags)) {
      ace.flags = fromPairs(formValues.advancedFlags.map((key) => [key, true])) as AdvancedNfsFlags;
    }

    return ace;
  }

  private updateFormValues(): void {
    const userField = this.form.controls.user;
    const groupField = this.form.controls.group;

    userField.clearValidators();
    groupField.clearValidators();

    if (this.isUserTag) {
      userField.addValidators(Validators.required);
    } else if (this.isGroupTag) {
      groupField.addValidators(Validators.required);
    }

    const formValues = {
      tag: this.ace().tag,
      type: this.ace().type,
      user: this.isUserTag ? this.ace().who : null,
      group: this.isGroupTag ? this.ace().who : null,
    } as EditNfsAceComponent['form']['value'];

    const permissions = this.ace().perms;
    if (areNfsPermissionsBasic(permissions)) {
      formValues.permissionType = NfsFormPermsType.Basic;
      formValues.basicPermission = permissions.BASIC;
      formValues.advancedPermissions = [];
    } else {
      formValues.permissionType = NfsFormPermsType.Advanced;
      formValues.advancedPermissions = Object.entries(permissions)
        .filter(([, isOn]) => isOn)
        .map(([permission]) => permission as NfsAdvancedPermission);
    }

    const flags = this.ace().flags;
    if (areNfsFlagsBasic(flags)) {
      formValues.flagsType = NfsFormFlagsType.Basic;
      formValues.basicFlag = flags.BASIC;
      formValues.advancedFlags = [];
    } else {
      formValues.flagsType = NfsFormFlagsType.Advanced;
      formValues.advancedFlags = Object.entries(flags)
        .filter(([, isOn]) => isOn)
        .map(([flag]) => flag as NfsAdvancedFlag);
    }

    this.form.patchValue(formValues, { emitEvent: false });
    this.form.markAllAsTouched();

    this.onFormStatusUpdated();
  }
}
