import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/ws.service';
import { TranslateService } from '@ngx-translate/core';

@Component ({
	selector: 'entity-empty',
	templateUrl: './entity-empty.component.html',
	styleUrls: ['./entity-empty.component.css'],
})
export class EntityEmptyComponent implements OnInit {
	@Input('conf') conf: any;

	constructor(
		protected ws: WebSocketService,
		protected router: Router,
		protected aroute: ActivatedRoute,
		public translate: TranslateService){

	}

	ngOnInit() {
		console.log("===2=");
	}

	doAction() {
		if (this.conf.button.action) {
			this.conf.button.action();
		}
	}
}
