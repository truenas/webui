import { Component } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup, Validators } from '@angular/forms';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService } from '../../../../../../services';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector : 'app-rsync-configuration-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class RYSNCConfigurationFormComponent {
    protected resource_name = 'services/rsyncmod/';
    protected addCall = 'rsyncmod.create';
    protected queryCall = 'rsyncmod.query';
    protected route_success: string[] = [ 'services','rsync','rsync-module' ];
    protected isEntity = true;
    public formGroup: FormGroup;
    protected pk: any;
    public fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'name',
        placeholder: 'Name',
        tooltip: '',
        validation: Validators.required
    },
    {
        type: 'input',
        name: 'comment',
        placeholder: 'Comment',
        tooltip: ''
    },
    {
        type : 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        placeholder: 'Path',
        name: 'path',
        tooltip: '',
        validation: Validators.required
    },
    {
        type: 'select',
        name: 'mode',
        placeholder: 'Access Mode',
        options: [
            { label: 'Read Only', value:'ro' },
            { label: 'Write Only', value:'wo' },
            { label: 'Read and Write', value:'rw' },
        ],
        tooltip: '',
    },
    {
        type: 'input',
        name: 'maxconn',
        placeholder: 'Maximum connections',
        inputType: 'number'
    },
    {
        type: 'select',
        name: 'user',
        placeholder: 'User',
        tooltip: '',
        options: []
    },
    {
        type: 'select',
        name: 'group',
        placeholder: 'Group',
        tooltip: '',
        options: []
    },
    {
        type: 'textarea',
        name: 'hostsallow',
        placeholder: 'Hosts Allow',
        tooltip: '',
        value: '',
      },
      {
        type: 'textarea',
        name: 'hostsdeny',
        placeholder: 'Hosts Deny',
        tooltip: '',
        value: '',
      },
      {
        type: 'textarea',
        name: 'auxiliary',
        placeholder: 'Auxiliary parameters',
        tooltip: '',
        value: '',
      },

    ];
    private group: any;
    private user: any;
    private hostsallow: any;
    private hostsdeny: any;
    protected entityForm: any;
    protected customFilter: any;
    constructor( protected ws: WebSocketService, protected router: Router, 
        protected route: ActivatedRoute) {

    }
    preInit(entityForm: any) {
        this.route.params.subscribe(params => {
          this.pk = params['pk'];
          this.customFilter = [[["id","=",this.pk]]]
        });
        this.entityForm = entityForm;
      }
    afterInit(entityForm: any) {
        this.user = _.find(this.fieldConfig, {name : "user"});
        entityForm.ws.call('user.query').subscribe((users) => {
            users.forEach((user) => {
                this.user.options.push({label : user.username, value : user.username})
                });
            });
        this.group = _.find(this.fieldConfig, {name : "group"});
        entityForm.ws.call('group.query').subscribe((groups) => {
            groups.forEach((group) => {
                this.group.options.push({label : group.group, value : group.group})
                });
            });
        if (!entityForm.isNew) {
            this.hostsallow = _.find(this.fieldConfig, {name : "hostsallow"});
            entityForm.submitFunction = this.submitFunction;

        }
    }
    beforeSubmit(entityForm: any){
        if (entityForm.hostsallow.length === 0){
            entityForm.hostsallow = []
        }
        else {
            entityForm.hostsallow = entityForm.hostsallow.split(',');
        }
        if (entityForm.hostsdeny.length === 0){
            entityForm.hostsdeny = []
        }
        else {
            entityForm.hostsdeny =  entityForm.hostsdeny.split(',');
        }
        
    }
    submitFunction(){
        const payload = _.cloneDeep(this.formGroup.value);
        return this.ws.call('rsyncmod.update', [this.pk, payload]);
    }
    

}