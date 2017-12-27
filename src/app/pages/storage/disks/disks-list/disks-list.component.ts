import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ZfsPoolData, VolumesListTableConfig } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';

export class DisksListConfig {
  
    protected flattenedVolData: any;
    protected resource_name = 'storage/disk/';
    public hideTopActions = true;
  
    public columns: Array<any> = [
      {name : 'Name', prop : 'disk_name'},
      {name : 'Serial', prop : 'disk_serial'},
      {name : 'Disk Size', prop : 'disk_size'},
      {name : 'Description', prop : 'disk_description'},
      {name : 'Transfer Mode', prop : 'disk_transfermode'},
      {name : 'HDD Standby', prop : 'disk_hddstandby'},
      {name : 'Advanced Power Management', prop : 'disk_advpowermgmt'},
      {name : 'Acoustic Level', prop : 'disk_acousticlevel'},
      {name : 'Enable S.M.A.R.T.', prop : 'disk_togglesmart'},
      {name : 'S.M.A.R.T. extra options', prop : 'disk_smartoptions'},
      {name : 'Enclosure Slot', prop : 'disk_enclosure_slot'}
    ];
    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    };
  
    constructor(
      protected _router: Router,
      protected _classId: string,
      public title: string) {
  
      if (typeof (this._classId) !== "undefined" && this._classId !== "") {
        this.resource_name += "/" + this._classId;
      }
    }
    
    getActions(row) {
      const actions = [];
  
      actions.push({
        label : "Edit",
        onClick : (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "disks", "edit", row1.disk_identifier
          ]));
        }
      });
      actions.push({
        label : "Wipe",
        onClick : (row1) => {
          this._router.navigate(new Array('/').concat([
            "storage", "disks", "wipe", row1.disk_name
          ]));
        }
      });
  
      return actions;
    }

    rowValue(row, attr) {
      switch (attr) {
        case 'disk_size':
          return filesize(row[attr], { standard: "iec" });
        default:
          return row[attr];
      }
    }
    
  }


@Component({
  selector: 'app-disks-list',
  templateUrl: './disks-list.component.html'
})
export class DisksListComponent extends EntityTableComponent implements OnInit, AfterViewInit {

  zfsPoolRows: ZfsPoolData[] = [];
  expanded_all = true;
  expanded_zfs = false;
  conf: DisksListConfig;

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService) {
    super(rest, router, ws, _eRef, dialog, loader);
      this.conf = new DisksListConfig(this.router, "", "");
  }

  ngOnInit(): void {

    

    this.rest.get("storage/volume", {}).subscribe((res) => {
      res.data.forEach((volume) => {
        volume.disksListConfig = new DisksListConfig(this.router, "", volume.name);
        volume.type = 'zpool';

        try {
          volume.avail = filesize(volume.avail, { standard: "iec" });
        } catch( error ) {
          console.log("error", error );
        }

        try {
          volume.used = filesize(volume.used, { standard: "iec" });
        } catch( error ) {
          console.log("error", error );
        }

        this.zfsPoolRows.push(volume);
        const volumeId = volume.id;
        this.ws.call('pool.get_disks', [volumeId]).subscribe((resGetDisks) => {
          console.log("disks for volume", volumeId, resGetDisks); 
        });
      });

      if( this.zfsPoolRows.length === 1 ) {
        this.expanded_zfs = true;
      }
    });

  }

  ngAfterViewInit(): void {

  }

}
