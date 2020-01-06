import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/ws.service';
import { TranslateService } from '@ngx-translate/core';

@Component ({
	selector: 'entity-dashboard',
	templateUrl: './entity-dashboard.component.html',
	styleUrls: ['./entity-dashboard.component.css'],
})
export class EntityDashboardComponent implements OnInit {

	public routeParts: any = [];
	protected parent: string = "";

	protected freenas_exclude = ['failover', 'viewenclosure'];
	protected truenas_exclude = ['acmedns'];
	constructor(
				protected ws: WebSocketService,
				protected router: Router,
				protected aroute: ActivatedRoute,
				public translate: TranslateService){

	}

	ngOnInit() {
		this.parent = this.aroute.parent.parent.routeConfig.path;
		let routeConfigs = this.aroute.parent.routeConfig.children;
		for (let i in routeConfigs) {
			if (routeConfigs[i].path !== "" && routeConfigs[i].path.indexOf(':') < 0) {
				if (_.find(routeConfigs[i].children, {path: 'add'})) {
					routeConfigs[i]['addPath'] = 'add';
				} else if (_.find(routeConfigs[i].children, {path: 'import'})) {
					routeConfigs[i]['addPath'] = 'import';
				}
				this.routeParts.push(routeConfigs[i]);
			}
		}
		
		let exclude = [];
		if (window.localStorage.getItem('is_freenas') === 'false') {
			exclude = exclude.concat(this.truenas_exclude);
			this.ws.call('failover.licensed').subscribe((is_ha) => {
				if (!is_ha) { // allow failover
					this.remove('failover');
				}
			});
		} else { // if freenas
			exclude = exclude.concat(this.freenas_exclude);
		}
		this.ws.call('ipmi.is_loaded').subscribe((res)=>{
			if(res !== true){ 
				this.remove('ipmi');
			}
		});
		this.ws.call('multipath.query').subscribe((res)=>{
			if (!res || res.length === 0) {
				this.remove('multipaths');
			}
		});
		for (let i = 0; i < exclude.length; i++) {
			this.remove(exclude[i]);
		}
	}

	remove(element) {
		this.routeParts = _.remove(this.routeParts, function(r) {
			return r['path'] !== element;
		});
	}

	goList(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path]));
	}

	goAdd(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path, item.addPath]));
	}
}