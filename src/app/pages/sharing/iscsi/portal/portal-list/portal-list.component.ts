import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { Overwrite } from 'utility-types';
import { Choices } from 'app/interfaces/choices.interface';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { PortalFormComponent } from 'app/pages/sharing/iscsi/portal/portal-form/portal-form.component';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

type IscsiPortalRow = Overwrite<IscsiPortal, {
  listen: string[];
}>;

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-portal-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
})
export class PortalListComponent implements EntityTableConfig<IscsiPortalRow> {
  tableTitle = this.translate.instant('Portals');
  queryCall = 'iscsi.portal.query' as const;
  wsDelete = 'iscsi.portal.delete' as const;
  routeAddTooltip = this.translate.instant('Add Portal');
  entityList: EntityTableComponent<IscsiPortalRow>;

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

  afterInit(entityList: EntityTableComponent<IscsiPortalRow>): void {
    this.entityList = entityList;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(PortalFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number, entityList: EntityTableComponent<IscsiPortalRow>): void {
    const portal = entityList.rows.find((row) => row.id === id);
    const listen = portal.listen.map((item: string) => {
      const lastIndex = item.lastIndexOf(':');
      return {
        ip: item.substring(0, lastIndex),
        port: Number(item.substring(lastIndex + 1)),
      };
    });

    const slideInRef = this.slideInService.open(PortalFormComponent, { data: { ...portal, listen } });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  prerequisite(): Promise<boolean> {
    return lastValueFrom(this.iscsiService.getIpChoices()).then((ips) => {
      this.ipChoices = ips;
      return true;
    });
  }

  resourceTransformIncomingRestData(portals: IscsiPortal[]): IscsiPortalRow[] {
    return portals.map((portal) => {
      const listen = portal.listen.map((listenInterface) => {
        const listenIp = this.ipChoices[listenInterface.ip] || listenInterface.ip;
        return `${listenIp}:${listenInterface.port}`;
      });

      return {
        ...portal,
        listen,
      };
    });
  }
}
