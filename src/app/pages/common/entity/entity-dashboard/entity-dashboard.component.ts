import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

@Component ({
	selector: 'entity-dashboard',
	templateUrl: './entity-dashboard.component.html',
	styleUrls: ['./entity-dashboard.component.css'],
})
export class EntityDashboardComponent implements OnInit {

	public routeParts: any = [];
	protected parent: string = "";
	constructor(protected router: Router,
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
	}

	goList(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path]));
	}

	goAdd(item) {
		this.router.navigate(new Array('/').concat([this.parent, item.path, item.addPath]));
	}
}