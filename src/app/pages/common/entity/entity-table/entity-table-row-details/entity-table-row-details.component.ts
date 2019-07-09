import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';

@Component ({
    selector: 'app-entity-table-row-details',
    templateUrl: './entity-table-row-details.component.html',
    styleUrls: ['./entity-table-row-details.component.css']
})
export class EntityTableRowDetailsComponent implements OnInit {
    @Input() config: any;
    @Input() parent: any;

    public direction = 'horizontal';
    public showActions = false;
    public columns = [];
    public actions = [];
    constructor(){}

    ngOnInit() {
        if (this.parent.conf.detailsConf) {
            this.direction = this.parent.conf.detailsConf.direction != undefined ? this.parent.conf.detailsConf.direction : 'horizontal';
            this.showActions = this.parent.conf.detailsConf.showActions != undefined ? this.parent.conf.detailsConf.showActions : false;
        }
        this.columns = this.parent.conf.detailColumns;
        if (this.showActions) {
            this.actions = this.parent.getActions(this.config);
            for (let i = 0; i < this.actions.length; i++) {
                if (this.parent.conf.isActionVisible) {
                this.actions[i].visible = this.parent.conf.isActionVisible.bind(
                    this.parent.conf)(this.actions[i].id, this.config);
                } else {
                this.actions[i].visible = true;
                }
            }
        } 
    }

    getPropValue(prop) {
        return _.get(this.config, prop.split('.'));
    }
}