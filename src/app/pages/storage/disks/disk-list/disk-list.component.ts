import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';
import * as _ from 'lodash';

@Component ({
	selector: 'disk-list',
	template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class DiskListComponent {
	public title = T("Disks");
	protected queryCall = "disk.query";

	public columns: Array<any> = [
	    { name: 'Name', prop: 'name', always_display: true },
	    { name: 'Pool', prop: "pool" },
	    { name: 'Serial', prop: 'serial' },
	    { name: 'Disk Size', prop: 'readable_size' },
	    { name: 'Description', prop: 'description', hidden: true },
	    { name: 'Transfer Mode', prop: 'transfermode', hidden: true },
	    { name: 'HDD Standby', prop: 'hddstandby', hidden: true },
	    { name: 'Adv. Power Management', prop: 'advpowermgmt' },
	    { name: 'Acoustic Level', prop: 'acousticlevel' },
	    { name: 'Enable S.M.A.R.T.', prop: 'togglesmart' },
	    { name: 'S.M.A.R.T. extra options', prop: 'smartoptions', hidden: true },
	    { name: 'Password for SED', prop: 'passwd', hidden: true },
	];
	public config: any = {
		paging: true,
		sorting: { columns: this.columns },
	};

	protected disk_pool: Map<string, string> = new Map<string, string>();
	constructor(protected ws: WebSocketService, protected router: Router) {
		this.ws.call('boot.get_disks', []).subscribe((boot_res)=>{
			for (let boot in boot_res) {
				this.disk_pool.set(boot_res[boot], T('Boot Pool'));
			}
		});
	}

	getActions(parentRow) {
   	const actions = [{
      label: T("Edit"),
      onClick: (row) => {
        this.router.navigate(new Array('/').concat([
          "storage", "disks", "edit", row.identifier
        ]));
      }
    }];
    this.ws.call('disk.get_unused', []).subscribe((res)=>{
			if (_.find(res, {"name": parentRow.name})) {
	    	actions.push({
	    		label: T("Wipe"),
	        onClick: (row) => {
	          this.router.navigate(new Array('/').concat([
	            "storage", "disks", "wipe", row.name
	          ]));
	        }
	    	})
	    }
		});
    
    return actions;
  }

	dataHandler(entityList: any) {
		this.ws.call('disk.get_unused', []).subscribe((unused_res)=>{
			for (let unused in unused_res) {
				this.disk_pool.set(unused_res[unused].name, T('Unused'));
			}
			this.ws.call('pool.query', []).subscribe((pool_res)=>{
				for (let pool in pool_res) {
					this.ws.call('pool.get_disks', [pool_res[pool].id]).subscribe((res) => {
						for (let k in res) {
							this.disk_pool.set(res[k], pool_res[pool].name);
						}
						for (let i = 0; i < entityList.rows.length; i++) {
				      entityList.rows[i].readable_size = (<any>window).filesize(entityList.rows[i].size, { standard: "iec" });
				      entityList.rows[i].pool = this.disk_pool.get(entityList.rows[i].name);
				    }
					});
				}
			});
		});
  }
}