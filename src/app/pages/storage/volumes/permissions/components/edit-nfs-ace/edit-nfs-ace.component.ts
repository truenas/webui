import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import {
  NfsAclTag,
  NfsAdvancedFlag,
  NfsAdvancedPermission,
} from 'app/enums/nfs-acl.enum';
import {
  AdvancedNfsFlags,
  AdvancedNfsPermissions,
  areNfsFlagsBasic,
  areNfsPermissionsBasic,
  BasicNfsFlags,
  BasicNfsPermissions,
  NfsAclItem,
} from 'app/interfaces/acl.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldRelationService } from 'app/pages/common/entity/entity-form/services/field-relation.service';
import { NULL_VALUE } from 'app/pages/common/entity/utils';
import { getEditNfsAceFieldSet } from 'app/pages/storage/volumes/permissions/components/edit-nfs-ace/edit-nfs-ace-field-set';
import {
  EditNfsAceFormValues,
  NfsFormFlagsType,
  NfsFormPermsType,
} from 'app/pages/storage/volumes/permissions/components/edit-nfs-ace/edit-nfs-ace-form-values.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { newNfsAce } from 'app/pages/storage/volumes/permissions/utils/new-ace.utils';
import { UserService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-edit-nfs-ace',
  template: '<entity-form [conf]="this"></entity-form>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNfsAceComponent implements FormConfiguration, OnChanges {
  @Input() ace: NfsAclItem;

  formGroup: FormGroup;
  fieldSets: FieldSet[] = [];
  fieldConfig: FieldConfig[] = [];
  hideSaveBtn = true;

  constructor(
    private userService: UserService,
    private store: DatasetAclEditorStore,
    private relationService: FieldRelationService,
  ) {
    this.fieldSets = getEditNfsAceFieldSet(userService);
  }

  ngOnChanges(): void {
    if (this.formGroup) {
      this.updateFormValues();
    }
  }

  preInit(): void {
    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((users) => {
      const userOptions = users.map((user) => ({ label: user.username, value: user.username }));

      const userControl = this.fieldConfig.find((config) => config.name === 'user') as FormComboboxConfig;
      userControl.options = userOptions;
    });

    this.userService.groupQueryDSCache().pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions = groups.map((group) => ({ label: group.group, value: group.group }));

      const groupControl = this.fieldConfig.find((config) => config.name === 'group') as FormComboboxConfig;
      groupControl.options = groupOptions;
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.formGroup = entityForm.formGroup;
    this.formGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onAceUpdated());
    this.formGroup.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.onFormStatusUpdated());

    this.updateFormValues();
  }

  onFormStatusUpdated(): void {
    this.store.updateSelectedAceValidation(this.formGroup.valid);
  }

  private updateFormValues(): void {
    const formValues = {
      tag: this.ace.tag,
      type: this.ace.type,
      user: this.ace.tag === NfsAclTag.User ? this.ace.who : '',
      group: this.ace.tag === NfsAclTag.UserGroup ? this.ace.who : '',
    } as EditNfsAceFormValues;

    if (areNfsPermissionsBasic(this.ace.perms)) {
      formValues.permissionType = NfsFormPermsType.Basic;
      formValues.basicPermission = this.ace.perms.BASIC;
      formValues.advancedPermissions = [];
    } else {
      formValues.permissionType = NfsFormPermsType.Advanced;
      formValues.advancedPermissions = Object.entries(this.ace.perms)
        .filter(([_, isOn]) => isOn)
        .map(([permission]) => permission as NfsAdvancedPermission);
    }

    if (areNfsFlagsBasic(this.ace.flags)) {
      formValues.flagsType = NfsFormFlagsType.Basic;
      formValues.basicFlag = this.ace.flags.BASIC;
      formValues.advancedFlags = [];
    } else {
      formValues.flagsType = NfsFormFlagsType.Advanced;
      formValues.advancedFlags = Object.entries(this.ace.flags)
        .filter(([_, isOn]) => isOn)
        .map(([flag]) => flag as NfsAdvancedFlag);
    }

    this.formGroup.reset(formValues, { emitEvent: false });

    // TODO: This is a workaround for form components relying on valueChanges instead of control-value-accessor.
    this.formGroup.get('advancedPermissions').setValue(formValues.advancedPermissions, { onlySelf: true });
    this.formGroup.get('advancedFlags').setValue(formValues.advancedFlags, { onlySelf: true });

    this.fieldConfig.forEach((config) => {
      this.relationService.refreshRelations(config, this.formGroup, { emitEvent: false });
    });

    this.formGroup.markAllAsTouched();

    setTimeout(() => {
      this.onFormStatusUpdated();
    });
  }

  private onAceUpdated(): void {
    const updatedAce = this.formValuesToAce();

    this.store.updateSelectedAce(updatedAce);
  }

  private formValuesToAce(): NfsAclItem {
    const formValues = this.formGroup.value as EditNfsAceFormValues;

    const ace = {
      tag: formValues.tag,
      type: formValues.type,
    } as NfsAclItem;

    switch (formValues.tag) {
      case NfsAclTag.User:
        ace.who = formValues.user;
        break;
      case NfsAclTag.UserGroup:
        ace.who = formValues.group;
        break;
    }

    if (formValues.permissionType === NfsFormPermsType.Basic) {
      if ((formValues.basicPermission as unknown) === NULL_VALUE) {
        ace.perms = { BASIC: newNfsAce.perms.BASIC };
      } else {
        ace.perms = { BASIC: formValues.basicPermission } as BasicNfsPermissions;
      }
    } else if (Array.isArray(formValues.advancedPermissions)) {
      ace.perms = _.fromPairs(formValues.advancedPermissions.map((key) => [key, true])) as AdvancedNfsPermissions;
    }

    if (formValues.flagsType === NfsFormFlagsType.Basic) {
      if ((formValues.basicFlag as unknown) === NULL_VALUE) {
        ace.flags = { BASIC: newNfsAce.flags.BASIC };
      } else {
        ace.flags = { BASIC: formValues.basicFlag } as BasicNfsFlags;
      }
    } else if (Array.isArray(formValues.advancedFlags)) {
      ace.flags = _.fromPairs(formValues.advancedFlags.map((key) => [key, true])) as AdvancedNfsFlags;
    }

    return ace;
  }
}
