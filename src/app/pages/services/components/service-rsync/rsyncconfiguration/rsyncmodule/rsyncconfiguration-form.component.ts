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
        tooltip: 'This <b>must</b> match the settings on the rsync\
                  client.',
        validation: Validators.required
    },
    {
        type: 'input',
        name: 'rsyncmod_comment',
        placeholder: 'Comment',
        tooltip: 'Describe this module.'
    },
    {
        type : 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        placeholder: 'Path',
        name: 'rsyncmod_path',
        tooltip: 'Browse to the pool or dataset to store received data.',
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
        tooltip: 'Choose permissions for this rsync module.',
    },
    {
        type: 'input',
        name: 'rsyncmod_maxconn',
        placeholder: 'Maximum connections',
        inputType: 'number',
        value: 0,
        validation: Validators.min(0),
        tooltip: 'Enter the number of maximum connections to this module.\
                  <i>0</i> is unlimited.',
    },
    {
        type: 'select',
        name: 'rsyncmod_user',
        placeholder: 'User',
        tooltip: 'Select the user to conduct file transfers to and from\
                  this module.',
        options: []
    },
    {
        type: 'select',
        name: 'rsyncmod_group',
        placeholder: 'Group',
        tooltip: 'Select the group to conduct file transfers to and from\
                  this module.',
        options: []
    },
    {
        type: 'textarea',
        name: 'rsyncmod_hostsallow',
        placeholder: 'Hosts Allow',
        tooltip: 'From <a\
                  href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
                  target="_blank">rsyncd.conf(5)</a>. Enter a list of\
                  patterns to match with the hostname and IP address of\
                  a connecting client. The connection is rejected if no\
                  patterns match. Separate patterns with whitespace or a\
                  comma.',
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_hostsdeny',
        placeholder: 'Hosts Deny',
        tooltip: 'From <a\
                  href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
                  target="_blank">rsyncd.conf(5)</a>. Enter a list of\
                  patterns to match with the hostname and IP address of\
                  a connecting client. The connection is rejected when\
                  the patterns match. Separate patterns with whitespace\
                  or a comma.',
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_auxiliary',
        placeholder: 'Auxiliary parameters',
        tooltip: 'Enter any additional settings from <a\
                  href="https://www.samba.org/ftp/rsync/rsyncd.conf.html"\
                  target="_blank">rsyncd.conf(5)</a>.',
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
