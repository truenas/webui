import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { T } from 'app/translate-marker';
import { IscsiService } from '../../../../../services/';

@Component({
  selector : 'app-iscsi-portal-list',
  template : `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `
})
export class PortalListComponent {
  public tableTitle = 'Portals';
  protected queryCall = 'iscsi.portal.query';
  protected wsDelete = 'iscsi.portal.delete';
  protected route_add: string[] = [ 'sharing', 'iscsi', 'portals', 'add' ];
  protected route_add_tooltip: string = "Add Portal";
  protected route_edit: string[] = [ 'sharing', 'iscsi', 'portals', 'edit' ];

  public columns: Array<any> = [
    {
      name : T('Portal Group ID'),
      prop : 'tag',
      always_display: true
    },
    {
      name : T('Listen'),
      prop : 'listen',
    },
    {
      name : T('Description'),
      prop : 'comment',
    },
    {
      name : T('Discovery Auth Method'),
      prop : 'discovery_authmethod',
    },
    {
      name : T('Discovery Auth Group'),
      prop : 'discovery_authgroup',
    },
  ];
  public rowIdentifier = 'tag';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: 'Portal',
      key_props: ['tag']
    },
  };
  public ipChoicies;
  constructor(protected router: Router, protected iscsiService: IscsiService) {}

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      await this.iscsiService.getIpChoices().toPromise().then(
        (res) => {
          this.ipChoicies = res;
          resolve(true);
        },
        (err) => {
          resolve(true);
        });
      });
  }

  dataHandler(data) {
    for (const i in data.rows) {
      for (const ip in data.rows[i].listen) {
        const listenIP = this.ipChoicies[data.rows[i].listen[ip].ip] || data.rows[i].listen[ip].ip;
        data.rows[i].listen[ip] = listenIP + ':' + data.rows[i].listen[ip].port;
      }
    }
  }
}
