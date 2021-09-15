import { Clipboard } from '@angular/cdk/clipboard';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { DialogService, WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ConfirmDialog } from '../common/confirm-dialog/confirm-dialog.component';
import { DialogFormConfiguration } from '../common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityUtils } from '../common/entity/utils';
import { ApiKeysRow } from './api-keys-row.interface';

@UntilDestroy()
@Component({
  selector: 'app-api-keys',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [Clipboard],
})
export class ApiKeysComponent implements EntityTableConfig {
  title = helptext.title;
  queryCall: 'api_key.query' = 'api_key.query';
  wsDelete: 'api_key.delete' = 'api_key.delete';
  route_add_tooltip = helptext.route_add_tooltip;
  addCall: 'api_key.create' = 'api_key.create';
  editCall: 'api_key.update' = 'api_key.update';

  currItem: ApiKeysRow;
  entityList: EntityTableComponent;

  columns = [
    { name: helptext.col_name, prop: 'name', always_display: true },
    { name: helptext.col_created_at, prop: 'created_time' },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.deleteMsg_title,
      key_props: ['name'],
    },
  };

  apikeysFormConf: DialogFormConfiguration = {
    title: helptext.formDialog.add_title,
    fieldConfig: [
      {
        type: 'input',
        name: 'name',
        placeholder: helptext.name.placeholder,
        tooltip: helptext.name.tooltip,
      },
      {
        type: 'checkbox',
        name: 'reset',
        placeholder: helptext.reset.placeholder,
        tooltip: helptext.reset.tooltip,
      },
    ],
    method_ws: this.addCall,
    saveButtonText: helptext.formDialog.add_button,
    customSubmit: this.doSubmit,
    afterInit(entityFrom: EntityDialogComponent) {
      const disableCheckbox = !this.parent.currItem;
      entityFrom.setDisabled('reset', disableCheckbox, disableCheckbox);
      if (this.parent.currItem) {
        entityFrom.formGroup.controls['name'].setValue(this.parent.currItem.name);
      }
    },
    parent: this,
  };

  timeZone: string;

  custActions = [
    {
      id: 'add',
      name: helptext.action_add,
      function: () => {
        this.apikeysFormConf.title = helptext.formDialog.add_title;
        this.apikeysFormConf.saveButtonText = helptext.formDialog.add_button;
        this.apikeysFormConf.method_ws = this.addCall;
        this.currItem = undefined;
        this.dialogService.dialogForm(this.apikeysFormConf);
      },
    },
    {
      id: 'docs',
      name: helptext.action_docs,
      function: () => {
        window.open(window.location.origin + '/api/docs');
      },
    },
  ];

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private dialog: MatDialog,
    private clipboard: Clipboard,
    private localeService: LocaleService,
  ) { }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }
  resourceTransformIncomingRestData(data: ApiKey[]): ApiKeysRow[] {
    return data.map((item) => {
      return {
        ...item,
        created_time: this.localeService.formatDateTime(item.created_at.$date),
      };
    });
  }

  doSubmit(entityDialogForm: EntityDialogComponent<this>): void {
    const that = entityDialogForm.parent;
    if (that.currItem) {
      that.ws.call(that.editCall, [that.currItem.id, entityDialogForm.formValue]).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          entityDialogForm.dialogRef.close(true);
          if (res.key) {
            that.displayKey(res.key);
          }
          that.entityList.getData();
        },
        (err: WebsocketError) => {
          new EntityUtils().handleWSError(that, err, that.dialogService, that.apikeysFormConf.fieldConfig);
        },
      );
    } else {
      that.ws.call(that.addCall, [entityDialogForm.formValue]).pipe(untilDestroyed(that)).subscribe(
        (res) => {
          entityDialogForm.dialogRef.close(true);
          that.displayKey(res.key);
          that.entityList.getData();
        },
        (err: WebsocketError) => {
          new EntityUtils().handleWSError(this, err, that.dialogService, that.apikeysFormConf.fieldConfig);
        },
      );
    }
  }

  displayKey(key: string): void {
    const self = this;
    const dialogRef = this.dialog.open(ConfirmDialog, { disableClose: true });
    dialogRef.componentInstance.title = helptext.apikeyCopyDialog.title;
    dialogRef.componentInstance.buttonMsg = helptext.apikeyCopyDialog.save_button;
    dialogRef.componentInstance.cancelMsg = helptext.apikeyCopyDialog.close_button;
    dialogRef.componentInstance.hideCheckBox = true;
    dialogRef.componentInstance.isSubmitEnabled = true;
    dialogRef.componentInstance.message = `
        ${helptext.apikeyCopyDialog.api_key_warning} <br><br>
        ${helptext.apikeyCopyDialog.api_key}:<br> ${key}`;
    dialogRef.componentInstance.customSubmit = () => {
      self.clipboard.copy(key);
    };
  }

  getActions(): EntityTableAction<ApiKeysRow>[] {
    return [{
      name: helptext.action_edit,
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      onClick: (rowinner: ApiKeysRow) => {
        this.apikeysFormConf.title = helptext.formDialog.edit_title;
        this.apikeysFormConf.saveButtonText = helptext.formDialog.edit_button;
        this.apikeysFormConf.method_ws = this.editCall;
        this.currItem = rowinner;
        this.dialogService.dialogForm(this.apikeysFormConf);
      },
    }, {
      name: helptext.action_delete,
      id: 'delete',
      icon: 'delete',
      label: 'Delete',
      onClick: (rowinner: ApiKeysRow) => {
        this.entityList.doDelete(rowinner);
      },
    }] as EntityTableAction[];
  }
}
