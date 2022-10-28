import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { AclTemplateByPath } from 'app/interfaces/acl.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import {
  SelectPresetModalConfig,
} from 'app/pages/datasets/modules/permissions/interfaces/select-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: 'select-preset-modal.component.html',
  styleUrls: ['./select-preset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPresetModalComponent implements OnInit {
  form = new FormGroup({
    presetName: new FormControl('', this.validatorsService.validateOnCondition(
      (control) => control.parent && control.parent.get('usePreset').value,
      Validators.required,
    )),
    usePreset: new FormControl(true),
  });

  presetOptions$: Observable<Option[]> = of([]);
  presets: AclTemplateByPath[] = [];

  readonly usePresetOptions$ = of([
    {
      label: helptext.type_dialog.radio_preset,
      tooltip: helptext.type_dialog.radio_preset_tooltip,
      value: true,
    },
    {
      label: helptext.type_dialog.radio_custom,
      value: false,
    },
  ]);

  readonly helptext = helptext.type_dialog;

  constructor(
    private dialogRef: MatDialogRef<SelectPresetModalComponent>,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private aclEditorStore: DatasetAclEditorStore,
    private dialogService: DialogService,
    private validatorsService: IxValidatorsService,
    @Inject(MAT_DIALOG_DATA) public data: SelectPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.setFormRelations();
    this.loadOptions();
  }

  private setFormRelations(): void {
    this.form.get('usePreset').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.get('presetName').updateValueAndValidity();
    });
  }

  private loadOptions(): void {
    this.loader.open();
    this.ws.call('filesystem.acltemplate.by_path', [{
      path: this.data.datasetPath,
      'format-options': {
        ensure_builtins: true,
        resolve_names: true,
      },
    }])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (presets) => {
          this.presets = presets;
          this.presetOptions$ = of(presets.map((preset) => ({
            label: preset.name,
            value: preset.name,
          })));
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
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
