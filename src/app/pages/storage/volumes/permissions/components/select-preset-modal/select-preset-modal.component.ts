import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DefaultAclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { Option } from 'app/interfaces/option.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { FieldRelationService } from 'app/pages/common/entity/entity-form/services/field-relation.service';
import { SelectPresetModalConfig } from 'app/pages/storage/volumes/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/storage/volumes/permissions/stores/dataset-acl-editor.store';
import { WebSocketService } from 'app/services';

const usePresetFieldName = 'usePreset';
const presetFieldName = 'preset';

@UntilDestroy()
@Component({
  templateUrl: 'select-preset-modal.component.html',
  styleUrls: ['./select-preset-modal.component.scss'],
})
export class SelectPresetModalComponent implements OnInit {
  formGroup = new FormGroup({
    [presetFieldName]: new FormControl('', Validators.required),
    [usePresetFieldName]: new FormControl('', Validators.required),
  });

  readonly helptext = helptext.type_dialog;

  readonly usePresetFieldConfig: FieldConfig = {
    type: 'radio',
    name: usePresetFieldName,
    options: [
      {
        label: helptext.type_dialog.radio_preset,
        tooltip: helptext.type_dialog.radio_preset_tooltip,
        value: true,
      },
      {
        label: helptext.type_dialog.radio_custom,
        value: false,
      },
    ],
    value: true,
  };

  readonly presetFieldConfig: FieldConfig = {
    type: 'select',
    name: presetFieldName,
    placeholder: helptext.type_dialog.input.placeholder,
    options: [] as Option[],
    relation: [
      {
        action: RelationAction.Show,
        when: [{
          name: usePresetFieldName,
          value: true,
        }],
      },
    ],
    required: true,
  };

  constructor(
    private dialogRef: MatDialogRef<SelectPresetModalComponent>,
    private ws: WebSocketService,
    private aclEditorStore: DatasetAclEditorStore,
    private fieldRelationService: FieldRelationService,
    @Inject(MAT_DIALOG_DATA) public data: SelectPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.loadOptions();
    this.initForm();
  }

  private initForm(): void {
    this.usePresetFieldConfig.isHidden = !this.data.allowCustom;
    this.formGroup.patchValue({
      [usePresetFieldName]: true,
    });

    this.fieldRelationService.setRelation(this.presetFieldConfig, this.formGroup);
  }

  private loadOptions(): void {
    this.ws.call('filesystem.default_acl_choices', [this.data.datasetPath])
      .pipe(untilDestroyed(this))
      .subscribe((choices) => {
        this.presetFieldConfig.options = choices.map((choice) => ({ label: choice, value: choice }));
      });
  }

  onContinuePressed(): void {
    const { usePreset, preset } = this.formGroup.value as { usePreset: boolean; preset: DefaultAclType };
    if (this.data.allowCustom && !usePreset) {
      this.dialogRef.close();
      return;
    }

    this.aclEditorStore.usePreset(preset);
    this.dialogRef.close();
  }
}
