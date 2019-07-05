import { Component, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';
import * as _ from 'lodash';
import { StorageService } from '../../../../services/storage.service';
import { DiskDetailsComponent } from './components/disk-details.component';

@Component ({
	selector: 'disk-list',
	template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class DiskListComponent {
	public title = T("Disks");
	protected queryCall = "disk.query";

	public columns: Array<any> = [
	    { name: T('Name'), prop: 'name', always_display: true },
	    { name: T('Pool'), prop: "pool" },
		{ name: T('Disk Size'), prop: 'readable_size' },
		{ name: T('Disk Type'), prop: 'type' },
	    { name: T('Serial'), prop: 'serial', hidden: true },
	    { name: T('Description'), prop: 'description', hidden: true },
	    { name: T('Transfer Mode'), prop: 'transfermode', hidden: true },
	    { name: T('HDD Standby'), prop: 'hddstandby', hidden: true },
	    { name: T('Adv. Power Management'), prop: 'advpowermgmt', hidden: true },
	    { name: T('Acoustic Level'), prop: 'acousticlevel', hidden: true },
	    { name: T('Enable S.M.A.R.T.'), prop: 'togglesmart', hidden: true },
	    { name: T('S.M.A.R.T. extra options'), prop: 'smartoptions', hidden: true },
	    { name: T('Password for SED'), prop: 'passwd', hidden: true },
	];
	public config: any = {
		paging: true,
		sorting: { columns: this.columns },
		multiSelect: true,
		deleteMsg: {
			title: 'User',
			key_props: ['name']
	    },
	};
	public diskIds: Array<any> = [];
	public diskNames: Array<any> = [];
	public hddStandby: Array<any> = [];
	public advPowerMgt: Array<any> = [];
	public acousticLevel: Array<any> = [];
	public diskToggle: boolean;
	public SMARToptions: Array<any> = [];
	public showActions = false;
	public hasDetails = true;
	public rowDetailComponent = DiskDetailsComponent;


  public multiActions: Array < any > = [{
		id: "medit",
		label: T("Edit Disk(s)"),
		icon: "edit",
		enable: true,
		ttpos: "above",
		onClick: (selected) => {
			if (selected.length > 1) {
				for(let i of selected) {
					this.diskIds.push(i.identifier);
					this.diskNames.push(i.name);
					this.hddStandby.push(i.hddstandby);
					this.advPowerMgt.push(i.advpowermgmt);
					this.acousticLevel.push(i.acousticlevel);
					if (i.togglesmart === true) {
						this.diskToggle = true;
						this.SMARToptions.push(i.smartoptions);
					}
				}
				this.diskbucket.diskIdsBucket(this.diskIds);
				this.diskbucket.diskNamesBucket(this.diskNames);
				this.diskbucket.diskToggleBucket(this.diskToggle);
				
				// If all items match in an array, this fills in the value in the form; otherwise, blank
				this.hddStandby.every( (val, i, arr) => val === arr[0] ) ?
					this.diskbucket.hddStandby = this.hddStandby[0] :
					this.diskbucket.hddStandby = undefined;
				
				this.advPowerMgt.every( (val, i, arr) => val === arr[0] ) ?
					this.diskbucket.advPowerMgt = this.advPowerMgt[0] :
					this.diskbucket.advPowerMgt = undefined;
				
				this.acousticLevel.every( (val, i, arr) => val === arr[0] ) ?
					this.diskbucket.acousticLevel = this.acousticLevel[0] :
					this.diskbucket.acousticLevel = undefined;
				
				this.SMARToptions.every( (val, i, arr) => val === arr[0] ) ?
					this.diskbucket.SMARToptions = this.SMARToptions[0] :
					this.diskbucket.SMARToptions = undefined;
					
				this.router.navigate(new Array('/').concat([
					"storage", "disks", "bulk-edit"
				]));
			} else {
				this.router.navigate(new Array('/').concat([
					"storage", "disks", "edit", selected[0].identifier
				]));
			}

		}
	}]

	protected disk_ready: EventEmitter<boolean> = new EventEmitter();
	protected unusedDisk_ready: EventEmitter<boolean> = new EventEmitter();
	public unused: any;
	protected disk_pool: Map<string, string> = new Map<string, string>();
	constructor(protected ws: WebSocketService, public router: Router,  public diskbucket: StorageService) {
		this.ws.call('boot.get_disks', []).subscribe((boot_res) => {
			for (const boot in boot_res) {
				this.disk_pool.set(boot_res[boot], T('Boot Pool'));
			}

			this.ws.call('disk.get_unused', []).subscribe((unused_res) => {
				this.unused = unused_res;
				this.unusedDisk_ready.emit(true);
				for (const unused in unused_res) {
					this.disk_pool.set(unused_res[unused].name, T('Unused'));
				}

				this.ws.call('pool.query', []).subscribe((pool_res) => {
					for (const pool in pool_res) {
						this.ws.call('pool.get_disks', [pool_res[pool].id]).subscribe((res) => {
							for (const k in res) {
								this.disk_pool.set(res[k], pool_res[pool].name);
							}
							this.disk_ready.emit(true);
						});
					}
				});
			});
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
		if (_.find(this.unused, {"name": parentRow.name})) {
	   	actions.push({
	   		label: T("Wipe"),
	       onClick: (row) => {
	        this.router.navigate(new Array('/').concat([
	          "storage", "disks", "wipe", row.name
	        ]));
	      }
	  	})
	  }
    return actions;
  }

	dataHandler(entityList: any) {
		this.disk_ready.subscribe((res)=>{
			for (let i = 0; i < entityList.rows.length; i++) {
	      entityList.rows[i].readable_size = (<any>window).filesize(entityList.rows[i].size, { standard: "iec" });
	      entityList.rows[i].pool = this.disk_pool.get(entityList.rows[i].name) || this.disk_pool.get(entityList.rows[i].devname);
	    }
		})


  }
}