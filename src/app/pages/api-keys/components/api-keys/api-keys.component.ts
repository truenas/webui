import { Clipboard } from '@angular/cdk/clipboard';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import {
  ApiKeyFormDialogComponent,
} from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeysRow } from 'app/pages/api-keys/components/api-keys/api-keys-row.interface';
import { WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'app-api-keys',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [Clipboard],
})
export class ApiKeysComponent implements EntityTableConfig {
  title = helptext.title;
  queryCall = 'api_key.query' as const;
  wsDelete = 'api_key.delete' as const;
  routeAddTooltip = helptext.route_add_tooltip;

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

  customActions = [
    {
      id: 'docs',
      name: helptext.action_docs,
      function: () => {
        window.open(window.location.origin + '/api/docs');
      },
    },
  ];

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
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

  doAdd(): void {
    this.openApiKeyForm();
  }

  getActions(): EntityTableAction<ApiKeysRow>[] {
    return [{
      name: helptext.action_edit,
      id: 'edit',
      icon: 'edit',
      label: 'Edit',
      onClick: (row: ApiKeysRow) => {
        this.openApiKeyForm(row);
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

  private openApiKeyForm(row?: ApiKeysRow): void {
    this.matDialog
      .open(ApiKeyFormDialogComponent, { data: row })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((shouldReload) => {
        if (shouldReload) {
          this.entityList.getData();
        }
      });
  }
}
