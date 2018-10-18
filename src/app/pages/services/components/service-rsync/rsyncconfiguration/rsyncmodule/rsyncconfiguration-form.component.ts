import { Component } from '@angular/core';
import * as _ from 'lodash';
import { FormGroup, Validators } from '@angular/forms';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';
import { WebSocketService, RestService } from '../../../../../../services';
import { ActivatedRoute, Router } from '@angular/router';
import helptext from '../../../../../../helptext/services/components/service-rsync';

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
        placeholder: helptext.rsyncmod_name_placeholder,
        tooltip: helptext.rsyncmod_name_tooltip,
        validation: Validators.required
    },
    {
        type: 'input',
        name: 'rsyncmod_comment',
        placeholder: helptext.rsyncmod_comment_placeholder,
        tooltip: helptext.rsyncmod_comment_tooltip
    },
    {
        type : 'explorer',
        initial: '/mnt',
        explorerType: 'directory',
        placeholder: helptext.rsyncmod_path_placeholder,
        name: 'rsyncmod_path',
        tooltip: helptext.rsyncmod_path_tooltip,
        validation: helptext.rsyncmod_path_validation
    },
    {
        type: 'select',
        name: 'rsyncmod_mode',
        placeholder: helptext.rsyncmod_mode_placeholder,
        options: helptext.rsyncmod_mode_options,
        tooltip: helptext.rsyncmod_mode_tooltip,
    },
    {
        type: 'input',
        name: 'rsyncmod_maxconn',
        placeholder: helptext.rsyncmod_maxconn_placeholder,
        inputType: 'number',
        value: 0,
        validation: helptext.rsyncmod_maxconn_validation,
        tooltip: helptext.rsyncmod_maxconn_tooltip,
    },
    {
        type: 'select',
        name: 'rsyncmod_user',
        placeholder: helptext.rsyncmod_user_placeholder,
        tooltip: helptext.rsyncmod_user_tooltip,
        options: []
    },
    {
        type: 'select',
        name: 'rsyncmod_group',
        placeholder: helptext.rsyncmod_group_placeholder,
        tooltip: helptext.rsyncmod_group_tooltip,
        options: []
    },
    {
        type: 'textarea',
        name: 'rsyncmod_hostsallow',
        placeholder: helptext.rsyncmod_hostsallow_placeholder,
        tooltip: helptext.rsyncmod_hostsallow_tooltip,
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_hostsdeny',
        placeholder: helptext.rsyncmod_hostsdeny_placeholder,
        tooltip: helptext.rsyncmod_hostsdeny_tooltip,
        value: '',
      },
      {
        type: 'textarea',
        name: 'rsyncmod_auxiliary',
        placeholder: helptext.rsyncd_auxiliary_placeholder,
        tooltip: helptext.rsyncd_auxiliary_tooltip,
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
