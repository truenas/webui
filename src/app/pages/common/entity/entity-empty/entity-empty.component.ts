import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/ws.service';
import { TranslateService } from '@ngx-translate/core';

export enum EmptyType {
	loading = 'duration',
	first_use = 'first_use',
	no_page_data = 'no_page_data',
	errors = 'errors',
	no_search_results = 'no_search_results',
};
export interface EmptyConfig {
	type: EmptyType, 
	large: boolean, 
	title: string, 
	message?: string, 
	icon?: string,
	button?: {
		label: string,
		action()
	}, 
}
@Component ({
	selector: 'entity-empty',
	templateUrl: './entity-empty.component.html',
	styleUrls: ['./entity-empty.component.scss'],
})

export class EntityEmptyComponent {
	@Input('conf') conf: any;

	constructor(
		protected ws: WebSocketService,
		protected router: Router,
		protected aroute: ActivatedRoute,
		public translate: TranslateService){

	}

	doAction() {
		if (this.conf.button.action) {
			this.conf.button.action();
		}
	}

  isLoading() {
    return this.conf.type == EmptyType.loading;
  }
  
	getIcon() {
		let icon = "logo";
		if (this.conf.icon) {
			icon = this.conf.icon;
		} else {
			switch (this.conf.type) {
				case EmptyType.loading:
					icon = "logo";
					break;
				case EmptyType.first_use:
					icon = "rocket";
					break;
				case EmptyType.no_page_data:
					icon = "format-list-text";
					break;
				case EmptyType.errors:
					icon = "alert-octagon";
					break;
				case EmptyType.no_search_results:
					icon = "magnify-scan";
					break;
			}
		}
		return icon;
	}
}
