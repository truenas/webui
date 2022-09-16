import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { Choices } from 'app/interfaces/choices.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { IscsiService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-portal-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
})
export class PortalListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Portals');
  queryCall = 'iscsi.portal.query' as const;
  wsDelete = 'iscsi.portal.delete' as const;
  routeAddTooltip = this.translate.instant('Add Portal');

  columns = [
    {
      name: this.translate.instant('Portal Group ID'),
      prop: 'tag',
      always_display: true,
    },
    {
      name: this.translate.instant('Listen'),
      prop: 'listen',
    },
    {
      name: this.translate.instant('Description'),
      prop: 'comment',
    },
    {
      name: this.translate.instant('Discovery Auth Method'),
      prop: 'discovery_authmethod',
    },
    {
      name: this.translate.instant('Discovery Auth Group'),
      prop: 'discovery_authgroup',
    },
  ];
  rowIdentifier = 'tag';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Portal'),
      key_props: ['tag'],
    },
  };
  ipChoices: Choices;

  constructor(
    protected iscsiService: IscsiService,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      entityList.getData();
    });
  }

  doAdd(): void {
    this.slideInService.open(PortalFormComponent);
  }

  doEdit(id: number, entityList: EntityTableComponent): void {
    const row = entityList.rows.find((row) => row.id === id);
    const listen = row.listen.map((item: string) => {
      const lastIndex = item.lastIndexOf(':');
      return {
        ip: item.substring(0, lastIndex),
        port: Number(item.substring(lastIndex + 1)),
      };
    });

    const form = this.slideInService.open(PortalFormComponent);
    form.setupForm({
      ...row,
      listen,
    });
  }

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve) => {
      await lastValueFrom(this.iscsiService.getIpChoices()).then(
        (ips) => {
          this.ipChoices = ips;
          resolve(true);
        },
        () => {
          resolve(true);
        },
      );
    });
  }

  dataHandler(entityTable: EntityTableComponent): void {
    entityTable.rows.forEach((row) => {
      for (const ip in row.listen) {
        const listenIp = this.ipChoices[row.listen[ip].ip] || row.listen[ip].ip;
        row.listen[ip] = listenIp + ':' + row.listen[ip].port;
      }
    });
  }
}
