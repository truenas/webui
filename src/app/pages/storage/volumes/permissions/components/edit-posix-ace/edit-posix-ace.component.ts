import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import {
  PosixAclItem,
} from 'app/interfaces/acl.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldRelationService } from 'app/pages/common/entity/entity-form/services/field-relation.service';
import { getEditPosixAceFieldSet } from 'app/pages/storage/volumes/permissions/components/edit-posix-ace/edit-posix-ace-field-set';
import { EditPosixAceFormValues } from 'app/pages/storage/volumes/permissions/components/edit-posix-ace/edit-posix-ace-form-values.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { UserService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-edit-posix-ace',
  template: '<entity-form [conf]="this"></entity-form>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPosixAceComponent implements FormConfiguration, OnChanges {
  @Input() ace: PosixAclItem;

  formGroup: FormGroup;
  fieldSets: FieldSet[] = [];
  fieldConfig: FieldConfig[] = [];
  hideSaveBtn = true;

  constructor(
    private userService: UserService,
    private store: DatasetAclEditorStore,
    private relationService: FieldRelationService,
  ) {
    this.fieldSets = getEditPosixAceFieldSet(userService);
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
      user: this.ace.tag === PosixAclTag.User ? this.ace.who : '',
      group: this.ace.tag === PosixAclTag.Group ? this.ace.who : '',
      default: this.ace.default,
      permissions: Object.entries(this.ace.perms)
        .filter(([_, isOn]) => isOn)
        .map(([permission]) => permission),
    } as EditPosixAceFormValues;

    this.formGroup.reset(formValues, { emitEvent: false });

    // TODO: This is a workaround for form components relying on valueChanges instead of control-value-accessor.
    this.formGroup.get('permissions').setValue(formValues.permissions, { onlySelf: true });

    this.fieldConfig.forEach((config) => {
      return this.relationService.refreshRelations(config, this.formGroup, { emitEvent: false });
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

  private formValuesToAce(): PosixAclItem {
    const formValues = this.formGroup.value as EditPosixAceFormValues;

    const ace = {
      tag: formValues.tag,
      default: formValues.default,
      perms: {
        [PosixPermission.Read]: formValues.permissions.includes(PosixPermission.Read),
        [PosixPermission.Write]: formValues.permissions.includes(PosixPermission.Write),
        [PosixPermission.Execute]: formValues.permissions.includes(PosixPermission.Execute),
      },
    } as PosixAclItem;

    switch (formValues.tag) {
      case PosixAclTag.User:
        ace.who = formValues.user;
        break;
      case PosixAclTag.Group:
        ace.who = formValues.group;
        break;
    }

    return ace;
  }
}
