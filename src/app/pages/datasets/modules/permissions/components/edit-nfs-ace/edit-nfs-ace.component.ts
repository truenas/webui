import { ChangeDetectionStrategy, Component, DestroyRef, input, OnChanges, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnRadioComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { fromPairs } from 'lodash-es';
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
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { newNfsAce } from 'app/pages/datasets/modules/permissions/utils/new-ace.utils';
import {
  NfsFormFlagsType,
  nfsFormFlagsTypeLabels,
  NfsFormPermsType,
  nfsFormPermsTypeLabels,
} from './edit-nfs-ace-form.types';

/** Builds a FormGroup with one boolean control per key of the given label map. */
function booleanGroupFromLabels<T extends string>(labels: Map<T, string>): FormGroup<Record<T, FormControl<boolean>>> {
  const controls = {} as Record<T, FormControl<boolean>>;
  for (const key of labels.keys()) {
    controls[key] = new FormControl(false, { nonNullable: true });
  }
  return new FormGroup(controls);
}

/** Builds a full boolean record for every key of the label map, reading truthiness from `source`. */
function booleanRecordFromLabels<T extends string>(
  labels: Map<T, string>,
  source: Partial<Record<T, boolean>>,
): Record<T, boolean> {
  const record = {} as Record<T, boolean>;
  for (const key of labels.keys()) {
    record[key] = !!source[key];
  }
  return record;
}

@Component({
  selector: 'ix-edit-nfs-ace',
  templateUrl: './edit-nfs-ace.component.html',
  styleUrls: ['./edit-nfs-ace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
    TnRadioComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class EditNfsAceComponent implements OnChanges, OnInit {
  private formBuilder = inject(FormBuilder);
  private store = inject(DatasetAclEditorStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly ace = input.required<NfsAclItem>();

  form = this.formBuilder.nonNullable.group({
    tag: [NfsAclTag.User as NfsAclTag],
    user: [null as string | null],
    group: [null as string | null],
    type: [NfsAclType.Allow],
    permissionType: [NfsFormPermsType.Basic],
    basicPermission: [newNfsAce.perms.BASIC],
    advancedPermissions: booleanGroupFromLabels(nfsAdvancedPermissionLabels),
    flagsType: [NfsFormFlagsType.Basic],
    basicFlag: [NfsBasicFlag.Inherit],
    advancedFlags: booleanGroupFromLabels(nfsAdvancedFlagLabels),
  });

  readonly tags = mapToOptions(nfsAclTagLabels, this.translate);
  readonly aclTypes = mapToOptions(nfsAclTypeLabels, this.translate);
  readonly permissionTypes = mapToOptions(nfsFormPermsTypeLabels, this.translate);
  readonly basicPermissions = mapToOptions(nfsBasicPermissionLabels, this.translate);
  readonly advancedPermissionOptions = mapToOptions(nfsAdvancedPermissionLabels, this.translate);
  readonly flagTypes = mapToOptions(nfsFormFlagsTypeLabels, this.translate);
  readonly basicFlags = mapToOptions(nfsBasicFlagLabels, this.translate);
  readonly advancedFlagOptions = mapToOptions(nfsAdvancedFlagLabels, this.translate);

  readonly tooltips = {
    tag: helptextAcl.tagTooltip,
    user: helptextAcl.userTooltip,
    group: helptextAcl.groupTooltip,
    type: helptextAcl.typeTooltip,
    permissionType: helptextAcl.permissionTypeTooltip,
    basicPermission: helptextAcl.permissionsTooltip,
    advancedPermissions: helptextAcl.permissionsTooltip,
    flagsType: helptextAcl.flagsTypeTooltip,
    basicFlag: helptextAcl.flagsTooltip,
    advancedFlags: helptextAcl.flagsTooltip,
  };

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onAceUpdated());
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onFormStatusUpdated());
  }

  private onFormStatusUpdated(): void {
    // Don't update validation status while async validators are pending
    // This prevents the "flash of invalid" during async validation
    if (this.form.pending) {
      return;
    }
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
      ace.who = formValues.user || undefined;
    } else if (this.isGroupTag) {
      ace.who = formValues.group || undefined;
    }

    if (formValues.permissionType === NfsFormPermsType.Basic) {
      if (!formValues.basicPermission) {
        ace.perms = { BASIC: newNfsAce.perms.BASIC };
      } else {
        ace.perms = { BASIC: formValues.basicPermission } as BasicNfsPermissions;
      }
    } else {
      ace.perms = fromPairs(
        Object.entries(formValues.advancedPermissions ?? {}).filter(([, isOn]) => isOn).map(([key]) => [key, true]),
      ) as AdvancedNfsPermissions;
    }

    if (formValues.flagsType === NfsFormFlagsType.Basic) {
      if (!formValues.basicFlag) {
        ace.flags = { BASIC: newNfsAce.flags.BASIC };
      } else {
        ace.flags = { BASIC: formValues.basicFlag } as BasicNfsFlags;
      }
    } else {
      ace.flags = fromPairs(
        Object.entries(formValues.advancedFlags ?? {}).filter(([, isOn]) => isOn).map(([key]) => [key, true]),
      ) as AdvancedNfsFlags;
    }

    return ace;
  }

  private updateFormValues(): void {
    // Use ace input values directly here, not the form getters
    // The getters read from this.form.value which hasn't been patched yet
    const aceTag = this.ace().tag;
    const isUserTag = aceTag === NfsAclTag.User;
    const isGroupTag = aceTag === NfsAclTag.UserGroup;

    const userField = this.form.controls.user;
    const groupField = this.form.controls.group;

    userField.clearValidators();
    groupField.clearValidators();

    if (isUserTag) {
      userField.addValidators(Validators.required);
    } else if (isGroupTag) {
      groupField.addValidators(Validators.required);
    }

    const formValues = {
      tag: aceTag,
      type: this.ace().type,
      user: isUserTag ? this.ace().who : null,
      group: isGroupTag ? this.ace().who : null,
    } as EditNfsAceComponent['form']['value'];

    const permissions = this.ace().perms;
    if (areNfsPermissionsBasic(permissions)) {
      formValues.permissionType = NfsFormPermsType.Basic;
      formValues.basicPermission = permissions.BASIC;
      formValues.advancedPermissions = booleanRecordFromLabels(nfsAdvancedPermissionLabels, {});
    } else {
      formValues.permissionType = NfsFormPermsType.Advanced;
      formValues.advancedPermissions = booleanRecordFromLabels(
        nfsAdvancedPermissionLabels,
        permissions as Partial<Record<NfsAdvancedPermission, boolean>>,
      );
    }

    const flags = this.ace().flags;
    if (areNfsFlagsBasic(flags)) {
      formValues.flagsType = NfsFormFlagsType.Basic;
      formValues.basicFlag = flags.BASIC;
      formValues.advancedFlags = booleanRecordFromLabels(nfsAdvancedFlagLabels, {});
    } else {
      formValues.flagsType = NfsFormFlagsType.Advanced;
      formValues.advancedFlags = booleanRecordFromLabels(
        nfsAdvancedFlagLabels,
        flags as Partial<Record<NfsAdvancedFlag, boolean>>,
      );
    }

    this.form.patchValue(formValues, { emitEvent: false });
    // Force status recalculation and event emission after patchValue
    // This ensures statusChanges fires when async validators complete
    userField.updateValueAndValidity({ onlySelf: true });
    groupField.updateValueAndValidity({ onlySelf: true });
    this.form.markAllAsTouched();

    this.onFormStatusUpdated();
  }
}
