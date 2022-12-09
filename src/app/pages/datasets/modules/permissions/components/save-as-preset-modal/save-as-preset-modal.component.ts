import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { AclType } from 'app/enums/acl-type.enum';
import { AclTemplateByPath } from 'app/interfaces/acl.interface';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { WebSocketService, AppLoaderService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './save-as-preset-modal.component.html',
  styleUrls: ['./save-as-preset-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAsPresetModalComponent implements OnInit {
  form = this.fb.group({
    presetName: ['', Validators.required],
  });
  presets: AclTemplateByPath[] = [];
  isFormLoading = false;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SaveAsPresetModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaveAsPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  isCurrentAclType(aclType: AclType): boolean {
    return aclType === this.data.aclType;
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
          this.presets = this.sortPresets(presets);
          this.cdr.markForCheck();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }

  private sortPresets(presets: AclTemplateByPath[]): AclTemplateByPath[] {
    return _.concat(
      presets.filter((preset) => this.isCurrentAclType(preset.acltype)).sort((a, b) => (a.name < b.name ? -1 : 1)),
      presets.filter((preset) => !this.isCurrentAclType(preset.acltype)).sort((a, b) => (a.name < b.name ? -1 : 1)),
    );
  }

  onSubmit(): void {
    // TODO: Save new preset
    this.dialogRef.close();
  }
}
