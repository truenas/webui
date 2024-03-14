import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { helptextAcl } from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { AclTemplateByPath } from 'app/interfaces/acl.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  SelectPresetModalConfig,
} from 'app/pages/datasets/modules/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: 'select-preset-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPresetModalComponent implements OnInit {
  form = new FormGroup({
    presetName: new FormControl('', this.validatorsService.validateOnCondition(
      (control) => control.parent?.get('usePreset')?.value,
      Validators.required,
    )),
    usePreset: new FormControl(true),
  });

  presetOptions$ = of<Option[]>([]);
  presets: AclTemplateByPath[] = [];

  readonly usePresetOptions$ = of([
    {
      label: helptextAcl.type_dialog.radio_preset,
      tooltip: helptextAcl.type_dialog.radio_preset_tooltip,
      value: true,
    },
    {
      label: helptextAcl.type_dialog.radio_custom,
      value: false,
    },
  ]);

  readonly helptext = helptextAcl.type_dialog;

  constructor(
    private dialogRef: MatDialogRef<SelectPresetModalComponent>,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private aclEditorStore: DatasetAclEditorStore,
    private validatorsService: IxValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: SelectPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.setFormRelations();
    this.loadOptions();
  }

  private setFormRelations(): void {
    this.form.controls.usePreset.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.controls.presetName.updateValueAndValidity();
    });
  }

  private loadOptions(): void {
    this.ws.call('filesystem.acltemplate.by_path', [{
      path: this.data.datasetPath,
      'format-options': {
        resolve_names: true,
      },
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((presets) => {
        this.presets = presets;
        this.presetOptions$ = of(presets.map((preset) => ({
          label: preset.name,
          value: preset.name,
        })));
      });
  }

  onContinuePressed(): void {
    const { usePreset, presetName } = this.form.value;
    if (this.data.allowCustom && !usePreset) {
      this.dialogRef.close();
      return;
    }

    const selectedPreset = this.presets.find((preset) => preset.name === presetName);

    this.aclEditorStore.usePreset(selectedPreset);
    this.dialogRef.close();
  }
}
