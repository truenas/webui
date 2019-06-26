import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from 'app/helptext/services/components/service-netdata';

@Component({
  selector: 'app-service-netdata',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceNetDataComponent {
    protected resource_name: string = 'services/netdata';
    protected isBasicMode: boolean = true;
    protected isEntity: boolean = true;
    protected route_success: string[] = [ 'services' ];
    protected addCall = 'netdata.update';
    protected queryCall = 'netdata.config';
    public fieldConfig: FieldConfig[] = []
    public fieldSets: FieldSet[] = [
        {
            name: 'global_settings',
            class: 'global_settings',
            label: false,
            config:[
                {
                    type: 'paragraph',
                    name: 'global_label',
                    paraText: helptext.global_paratext
                },
                {
                    type : 'input',
                    name : 'history',
                    placeholder : helptext.history.placeholder,
                    tooltip: helptext.history.tooltip,
                    validation: helptext.history.validation
                    
                },
                {
                    type : 'input',
                    name : 'update_every',
                    placeholder : helptext.update_every.placeholder,
                    tooltip: helptext.update_every.tooltip,
                    validation: helptext.update_every.validation
                },
                {
                    type : 'input',
                    name : 'http_port_listen_backlog',
                    placeholder : helptext.http_port_listen_backlog.placeholder,
                    tooltip: helptext.http_port_listen_backlog.tooltip,
                    validation: helptext.http_port_listen_backlog.validation
                },
                {
                    type : 'select',
                    name : 'bind', // array of strings [{'string'}] ???
                    placeholder : helptext.bind.placeholder,
                    tooltip: helptext.bind.tooltip,
                    options: [],
                    multiple : true,
                },
                {
                    type : 'input',
                    name : 'port',
                    placeholder : helptext.port.placeholder,
                    tooltip: helptext.port.tooltip,
                    validation: helptext.port.validation
                },
                {
                    type : 'textarea',
                    name : 'additional_params',
                    placeholder : helptext.additional_params.placeholder,
                    tooltip: helptext.additional_params.tooltip
                }
            ]
        },
        {
            name: 'alarms',
            class: 'alarms',
            label: false,
            config:[
                {
                    type : 'select',
                    name : 'alarms',
                    placeholder : helptext.alarms.placeholder,
                    tooltip: helptext.alarms.tooltip,
                    options: [],
                    multiple: true
                }
            ]
        },
        {
            name: 'streaming_metrics',
            class: 'streaming_metrics',
            label: false,
            config:[
                {
                    type: 'paragraph',
                    name: 'streaming_label',
                    paraText: helptext.streaming_paratext
                },
                {
                    type : 'select',
                    name : 'stream_mode',
                    placeholder : helptext.stream_mode.placeholder,
                    tooltip: helptext.stream_mode.tooltip,
                    options : [
                        {label : 'None', value : 'NONE'},
                        {label : 'Slave', value : 'SLAVE'},
                        {label : 'Master', value : 'MASTER'}
                    ],
                },
                {
                    type : 'textarea',
                    name : 'destination',
                    placeholder : helptext.destination.placeholder,
                    tooltip: helptext.destination.tooltip,
                    isHidden: true
                },
                {
                    type : 'input', 
                    name : 'api_key',
                    placeholder : helptext.api_key.placeholder,
                    tooltip: helptext.api_key.tooltip,
                    isHidden: true
                },
                {
                    type : 'input', 
                    name : 'allow_from',
                    placeholder : helptext.allow_from.placeholder,
                    tooltip: helptext.allow_from.tooltip,
                    isHidden: true
                }
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
        'allow_from',
        'streaming_label',
        'alarms_label'
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

    private bind: any;
    private alarms: any;
    private allAlarmEntries: any;

    constructor(
        protected router: Router,
        protected ws: WebSocketService,
    ) {}

    afterInit(entity: any) {
        entity.formGroup.controls['stream_mode'].valueChanges.subscribe((res) => {
            if (res === 'NONE') {
                this.hideField('destination', true, entity);
                this.hideField('api_key', true, entity);
                this.hideField('allow_from', true, entity);
            } else if (res === 'SLAVE') {
                this.hideField('destination', false, entity);
                this.hideField('api_key', false, entity);
                this.hideField('allow_from', true, entity);
            } else if (res === 'MASTER') {
                this.hideField('destination', true, entity);
                this.hideField('api_key', false, entity);
                this.hideField('allow_from', false, entity);
            }
        });

        this.ws.call(this.queryCall).subscribe((res) => {
            console.log(res);
            entity.formGroup.controls['history'].setValue(res.history);
            entity.formGroup.controls['update_every'].setValue(res.update_every);
            entity.formGroup.controls['http_port_listen_backlog'].setValue(res.http_port_listen_backlog);
           
            // bind
            this.bind = _.find(this.fieldConfig, {'name' : 'bind'});
            res.bind.forEach((item) => {
                this.bind.options.push(
                    {label : item, value : item});
            });
            
            entity.formGroup.controls['port'].setValue(res.port);
            entity.formGroup.controls['additional_params'].setValue(res.additional_params);
            
            //alarms
            let currentAlarms = [];
            this.alarms = _.find(this.fieldConfig, {'name' : 'alarms'});
            this.allAlarmEntries = Object.entries(res.alarms);
            for (const [name, value] of this.allAlarmEntries) {
                this.alarms.options.push({label: name, value: name});
                if (value['enabled']) {
                    currentAlarms.push(name);
                }
            }
            entity.formGroup.controls['alarms'].setValue(currentAlarms);

            entity.formGroup.controls['stream_mode'].setValue(res.stream_mode);
            //destination
            entity.formGroup.controls['destination'].setValue(res.destination);

            entity.formGroup.controls['api_key'].setValue(res.api_key);
            entity.formGroup.controls['allow_from'].setValue(res.allow_from);
        })
    }

    hideField(fieldName: any, show: boolean, entity: any) {
        let target = _.find(this.fieldConfig, {'name' : fieldName});
        target['isHidden'] = show;
        entity.setDisabled(fieldName, show, show);
    }

    beforeSubmit(data: any){
        console.log(data);
        const values = Object.values(this.allAlarmEntries)
        for (let value of values) {
            value[1] = {enabled: false};
        }
        let obj = {};
        data.alarms.forEach((alarm) => {
            this.allAlarmEntries.forEach((entry) =>  {
                if (alarm === entry[0]) {
                    entry[1] = {enabled: true};
                }
                obj[entry[0]] = entry[1]
            });
        });
        data.alarms = obj;
        data.destination = data.destination.replace(/\n/g, ' ').replace(/,/g, ' ').split(' ');
        console.log(data.destination)
        delete data.global_label;
        delete data.streaming_label;
    }
}
