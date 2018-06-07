import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

@Component ({
	selector: 'entity-dashboard',
	templateUrl: './entity-dashboard.component.html',
})
export class EntityDashboardComponent implements OnInit {

	public routeParts: any = [];
	protected parent: string = "";
	constructor(protected router: Router,
				protected aroute: ActivatedRoute){

	}

	ngOnInit() {
		this.parent = this.aroute.parent.parent.routeConfig.path;
		let routeConfigs = this.aroute.parent.routeConfig.children;
		for (let i in routeConfigs) {
			if (routeConfigs[i].path !== "") {
				if (_.find(routeConfigs[i].children, {path: 'add'})) {
					routeConfigs[i]['addPath'] = 'add';
				}
				this.routeParts.push(routeConfigs[i]);
			}
		}
	}

	goList(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path]));
	}

	goAdd(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path, item.addPath]));
	}
}