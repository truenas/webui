import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { T } from '../../../translate-marker';
import { IdmapService } from 'app/services/idmap.service';
import { DialogService } from 'app/services/dialog.service';
import helptext from '../../../helptext/directoryservice/idmap';

@Component({
  selector: 'app-idmap-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class IdmapListComponent {
  public title = "Idmap";
  protected queryCall = 'idmap.query';
  protected route_add_tooltip = T("Add Idmap");
  protected route_edit: string[] = [ 'directoryservice', 'idmap', 'edit' ];
  protected route_delete: string[] = [ 'idmap', 'delete' ];
  protected entityList: any;

  public columns: Array<any> = [
    {name : 'Name', prop : 'name', always_display: true},
    {name : 'DNS Domain Name', prop : 'dns_domain_name'},
    {name : 'Range Low', prop : 'range_low'},
    {name : 'Range High', prop : 'range_high'},
    {name : 'Backend', prop : 'idmap_backend'},
    {name : 'Certificate', prop : 'certificate_id'},
  ];

  public rowIdentifier = 'name';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: T('Idmap'),
      key_props: ['name']
    },
  };

  constructor(protected idmapService: IdmapService, protected router: Router,
    protected dialogService: DialogService) { }

  afterInit(entityList: any) { 
    this.entityList = entityList; 
  }

  getAddActions() {
    return [{
      label: T('Add'),
      onClick: () => {
        this.idmapService.getADStatus().subscribe((res) => {
          if (res.enable) {
            this.router.navigate(['directoryservice', 'idmap', 'add'])
          } else {
            this.dialogService.confirm(helptext.idmap.enable_ad_dialog.title, helptext.idmap.enable_ad_dialog.message, 
              true, helptext.idmap.enable_ad_dialog.button).subscribe((res) => {
             if(res) {
               this.router.navigate(['directoryservice', 'activedirectory'])
             }
            })
          }
        })      
      }
    }];
  }
  

}
