import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService, AppLoaderService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'app-service-netdata',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceNetDataComponent implements OnInit {
    protected resource_name: string = 'services/netdata';
    protected isBasicMode: boolean = true;
    protected route_success: string[] = [ 'services' ];

    public fieldConfig: FieldConfig[] = []
    public fieldSets: FieldSet[] = [
        {
            name: '',
            class: '',
            label: false,
            config:[
                {
                    type : 'input', // validate as int
                    name : 'history',
                    placeholder : 'History',
                    tooltip: 'The number of entries the netdata daemon will by default keep in memory for each chart dimension.'
                },
                {
                    type : 'input', // validate as int
                    name : 'update_frequency',
                    placeholder : 'Update Frequency',
                    tooltip: 'The frequency in seconds, for data collection.'
                },
                {
                    type : 'input', // validate as int
                    name : 'http_port_listen_backlog',
                    placeholder : 'HTTP Port Listen Backlog',
                    tooltip: 'The port backlog'
                },
                {
                    type : 'select',
                    name : 'bind_to',
                    placeholder : 'Bind to',
                    tooltip: 'Select one or more IP addresses to which to bind the Netdata service.',
                    multiple : true,
                    options : [
                        {label : '0.0.0.0', value : '0.0.0.0'},
                        {label : '10.231.2.63', value : '10.231.2.63'},
                        {label : 'other_dummy', value : 'Dummy Data'}
                    ]
                },
                {
                    type : 'input', // validate as int
                    name : 'bind_to_port',
                    placeholder : 'Bind to port',
                    tooltip: 'The port which will be used with selected bind to IP addresses',
                    value: 19999
                },
                {
                    type : 'textarea', // need more info on accceptable key/values
                    name : 'additional_params',
                    placeholder : 'Additional parameters',
                    tooltip: 'Instructions on adding keys and vlaues',
                }
            ]
        },
        {
            name: '',
            class: '',
            label: false,
            config:[
                {
                    type : 'textarea', // need more info on accceptable key/values
                    name : 'alarms',
                    placeholder : 'Placeholder for dynamically created alarms',
                    tooltip: 'Instructions on alarms',
                }
            ]
        },
        {
            name: '',
            class: '',
            label: false,
            config:[
                {
                    type : 'select',
                    name : 'stream_mode',
                    placeholder : 'Stream Mode',
                    tooltip: 'Select a stream mode if system is to be used for streaming',
                    options : [
                        {label : 'None', value : 'none'},
                        {label : 'Slave', value : 'slave'},
                        {label : 'Master', value : 'master'}
                    ],
                    value: 'none'
                },
                {
                    type : 'input', 
                    name : 'destination',
                    placeholder : 'Destination',
                    tooltip: 'Please provide line/space separated list of destinations where the collected metrics are to be sent in the format HOST:PORT',
                    isHidden: true
                },
                {
                    type : 'input', 
                    name : 'api_key',
                    placeholder : 'API Key',
                    tooltip: 'The API_KEY to use (as the sender)',
                    isHidden: true
                },
                {
                    type : 'input', 
                    name : 'allow_from',
                    placeholder : 'Allow from',
                    tooltip: 'A list of simple patterns matching the IPs of the servers that will be pushing metrics using this API key.',
                    value: "*",
                    isHidden: true
                },
                
            ]
        }
    ];

    protected advanced_field: Array<any> = [
        'http_port_listen_backlog',
        'additional_params',
        'alarms',
        'stream_mode',
        'destination',
        'api_key',
        'allow_from'
    ];

    isCustActionVisible(actionId: string) {
        if (actionId == 'advanced_mode' && this.isBasicMode == false) {
            return false;
        } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
            return false;
        }
        return true;
    }

    public custActions: Array<any> = [
        {
            id : 'basic_mode',
            name : 'Basic Mode',
            function : () => { this.isBasicMode = !this.isBasicMode; }
        },
        {
            'id' : 'advanced_mode',
            name : 'Advanced Mode',
            function : () => { this.isBasicMode = !this.isBasicMode; }
        }
    ];
    constructor(
        protected router: Router,
        protected ws: WebSocketService,
    ) {}

    afterInit(entity: any) {
        entity.formGroup.controls['stream_mode'].valueChanges.subscribe((res) => {
            console.log(res)
            if (res === 'none') {
                this.hideField('destination', true, entity);
                this.hideField('api_key', true, entity);
                this.hideField('allow_from', true, entity);
            } else if (res === 'slave') {
                this.hideField('destination', false, entity);
                this.hideField('api_key', false, entity);
                this.hideField('allow_from', true, entity);
            } else if (res === 'master') {
                this.hideField('destination', true, entity);
                this.hideField('api_key', false, entity);
                this.hideField('allow_from', false, entity);
            }
        })
    }

    ngOnInit() {

    }

    hideField(fieldName: any, show: boolean, entity: any) {
        let target = _.find(this.fieldConfig, {'name' : fieldName});
        target['isHidden'] = show;
        entity.setDisabled(fieldName, show, show);
    }
}