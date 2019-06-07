import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService, AppLoaderService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-service-netdata',
  template : ` <entity-form [conf]="this"></entity-form>`
})
export class ServiceNetDataComponent implements OnInit {
    protected resource_name: string = 'services/netdata';
    protected isBasicMode: boolean = true;
    protected route_success: string[] = [ 'services' ];

    public fieldConfig: FieldConfig[] = [
        {
            type : 'select',
            name : 'basic_field_1',
            placeholder : 'Basic Field 1',
            tooltip: 'Basic field one.',
            multiple : true,
            options : [
                {label : 'Verbose', value : 'VERBOSE'},
                {label : 'Debug', value : 'DEBUG'},
                {label : 'Debug2', value : 'DEBUG2'},
                {label : 'Debug3', value : 'DEBUG3'}
            ]
        },
        {
            type : 'input',
            name : 'basic_field_2',
            placeholder : 'Basic Field 2',
            tooltip: 'Another basic field',
        },
        {
            type : 'checkbox',
            name : 'advanced_checkbox',
            placeholder : 'Advanced checkbox',
            tooltip: 'Advanced checkbox',
        },
        {
            type : 'input',
            name : 'advanced_input',
            placeholder : 'Advanced Input',
            tooltip: 'Another advanced field'
        }
    ];
    
    protected advanced_field: Array<any> = [
        'advanced_checkbox',
        'advanced_input'
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

    afterInit(entityEdit: any) { }


    ngOnInit() {

    }
}