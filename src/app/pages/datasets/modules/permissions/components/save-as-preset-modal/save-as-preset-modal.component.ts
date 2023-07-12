import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { AclType } from 'app/enums/acl-type.enum';
import {
  Acl, AclTemplateByPath, AclTemplateCreateParams, NfsAclItem, PosixAclItem,
} from 'app/interfaces/acl.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SaveAsPresetModalConfig } from 'app/pages/datasets/modules/permissions/interfaces/save-as-preset-modal-config.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { WebSocketService, AppLoaderService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

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
  acl: Acl;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SaveAsPresetModalComponent>,
    private store: DatasetAclEditorStore,
    @Inject(MAT_DIALOG_DATA) public data: SaveAsPresetModalConfig,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.isFormLoading = state.isLoading;
        this.acl = state.acl;
        this.cdr.markForCheck();
      });
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
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
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
    const newAcl = _.cloneDeep(this.acl);
    const payload: AclTemplateCreateParams = {
      name: this.form.value.presetName,
      acltype: this.acl.acltype,
      acl: newAcl.acl.map((acl) => {
        delete acl.who;
        return _.cloneDeep(acl);
      }) as NfsAclItem[] | PosixAclItem[],
    };

    this.loader.open();
    this.ws.call('filesystem.acltemplate.create', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogRef.close();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  onRemovePreset(preset: AclTemplateByPath): void {
    this.loader.open();
    this.ws.call('filesystem.acltemplate.delete', [preset.id]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loadOptions();
        this.loader.close();
      },
      error: (error: WebsocketError) => {
        this.loader.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }
}
