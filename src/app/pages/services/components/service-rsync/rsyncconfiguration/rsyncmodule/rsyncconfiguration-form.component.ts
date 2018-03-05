import { Component } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup, Validators } from '@angular/forms';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService, RestService } from '../../../../../../services';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector : 'app-rsync-configuration-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class RYSNCConfigurationFormComponent {
    protected resource_name = 'services/rsyncmod/';
    protected route_success: string[] = [ 'services','rsync','rsync-module' ];
    protected isEntity = true;
    public formGroup: FormGroup;
    protected pk: any;
    public fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'rsyncmod_name',
        placeholder: 'Name',
        tooltip: '',
        validation: Validators.required
    },
    {
        type: 'input',
        name: 'rsyncmod_comment',
        placeholder: 'Comment',
        tooltip: ''
    },
    {
        type : 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        placeholder: 'Path',
        name: 'rsyncmod_path',
        tooltip: '',
        validation: Validators.required
    },
    {
        type: 'select',
        name: 'rsyncmod_mode',
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
        name: 'rsyncmod_maxconn',
        placeholder: 'Maximum connections',
        inputType: 'number',
        value: 0,
        validation: Validators.min(0),
        tooltip: '',
    },
    {
        type: 'select',
        name: 'rsyncmod_user',
        placeholder: 'User',
        tooltip: '',
        options: []
    },
    {
        type: 'select',
        name: 'rsyncmod_group',
        placeholder: 'Group',
        tooltip: '',
        options: []
    },
    {
        type: 'textarea',
        name: 'rsyncmod_hostsallow',
        placeholder: 'Hosts Allow',
        tooltip: '',
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_hostsdeny',
        placeholder: 'Hosts Deny',
        tooltip: '',
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_auxiliary',
        placeholder: 'Auxiliary parameters',
        tooltip: '',
        value: '',
      },

    ];
    private rsyncmod_group: any;
    private rsyncmod_user: any;
    protected entityForm: any;
    protected customFilter: any;
    constructor( protected ws: WebSocketService, protected router: Router,
        protected rest: RestService, protected route: ActivatedRoute) {

    }
    preInit(entityForm: any) {
        this.route.params.subscribe(params => {
          this.pk = params['pk'];
        });
        this.entityForm = entityForm;
      }
    afterInit(entityForm: any) {
        this.rsyncmod_user = _.find(this.fieldConfig, {name : "rsyncmod_user"});
        entityForm.ws.call('user.query').subscribe((users) => {
            users.forEach((user) => {
                this.rsyncmod_user.options.push({label : user.username, value : user.username})
                });
            });
        this.rsyncmod_group = _.find(this.fieldConfig, {name : "rsyncmod_group"});
        entityForm.ws.call('group.query').subscribe((groups) => {
            groups.forEach((group) => {
                this.rsyncmod_group.options.push({label : group.group, value : group.group})
                });
            });
}
}