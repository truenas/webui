import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import helptext from '../../../../../../helptext/services/components/service-rsync';
import { UserService, WebSocketService } from '../../../../../../services';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-rsync-configuration-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class RYSNCConfigurationFormComponent {
    protected queryCall = 'rsyncmod.query';
    protected route_success: string[] = [ 'services','rsync','rsync-module' ];
    protected isEntity = true;
    public formGroup: FormGroup;
    protected pk: any;
    public title = helptext.moduleFormTitle;
    protected addCall = 'rsyncmod.create';
    protected isNew: boolean;
    public fieldConfig: FieldConfig[] = [];
    public fieldSets: FieldSet[] = [
        {
            name: helptext.rsyncd_fieldset_general,
            label: true,
            width: '49%',
            config: [{
                type: 'input',
                name: 'name',
                placeholder: helptext.rsyncmod_name_placeholder,
                tooltip: helptext.rsyncmod_name_tooltip,
                validation: Validators.required,
                required: true
            }, {
                type : 'explorer',
                initial: '/mnt',
                explorerType: 'directory',
                placeholder: helptext.rsyncmod_path_placeholder,
                name: 'path',
                tooltip: helptext.rsyncmod_path_tooltip,
                validation: helptext.rsyncmod_path_validation,
                required: true
            }, {
                type: 'input',
                name: 'comment',
                placeholder: helptext.rsyncmod_comment_placeholder,
                tooltip: helptext.rsyncmod_comment_tooltip
            }, {
                type: 'checkbox',
                name: 'enabled',
                placeholder: helptext.rsyncmod_enabled_placeholder,
                tooltip: helptext.rsyncmod_enabled_tooltip,
            }]
        },
        { name: 'spacer', label: false, width: '2%' },
        {
            name: helptext.rsyncd_fieldset_access,
            label: true,
            width: '49%',
            config: [
                {
                    type: 'select',
                    name: 'mode',
                    placeholder: helptext.rsyncmod_mode_placeholder,
                    options: helptext.rsyncmod_mode_options,
                    tooltip: helptext.rsyncmod_mode_tooltip,
                    required: true
                },
                {
                    type: 'input',
                    name: 'maxconn',
                    placeholder: helptext.rsyncmod_maxconn_placeholder,
                    inputType: 'number',
                    value: 0,
                    validation: helptext.rsyncmod_maxconn_validation,
                    tooltip: helptext.rsyncmod_maxconn_tooltip,
                },
                {
                    type: 'combobox',
                    name: 'user',
                    placeholder: helptext.rsyncmod_user_placeholder,
                    tooltip: helptext.rsyncmod_user_tooltip,
                    options: [],
                    searchOptions: [],
                    parent: this,
                    updater: this.updateUserSearchOptions,
                },
                {
                    type: 'combobox',
                    name: 'group',
                    placeholder: helptext.rsyncmod_group_placeholder,
                    tooltip: helptext.rsyncmod_group_tooltip,
                    options: [],
                    searchOptions: [],
                    parent: this,
                    updater: this.updateGroupSearchOptions,
                },
                {
                    type: 'chip',
                    name: 'hostsallow',
                    placeholder: helptext.rsyncmod_hostsallow_placeholder,
                    tooltip: helptext.rsyncmod_hostsallow_tooltip,
                },
                {
                    type: 'chip',
                    name: 'hostsdeny',
                    placeholder: helptext.rsyncmod_hostsdeny_placeholder,
                    tooltip: helptext.rsyncmod_hostsdeny_tooltip,
                }
            ]
        },
        { name: 'divider', divider: true },
        {
            name: helptext.rsyncd_fieldset_other,
            label: true,
            config: [
                {
                    type: 'textarea',
                    name: 'auxiliary',
                    placeholder: helptext.rsyncd_auxiliary_placeholder,
                    tooltip: helptext.rsyncd_auxiliary_tooltip,
                    value: '',
                }
            ]
        },
        { name: 'divider', divider: true }
    ];

    private rsyncmod_group: any;
    private rsyncmod_user: any;
    protected entityForm: any;
    protected customFilter: any;
    constructor( protected ws: WebSocketService, protected router: Router,
        protected userService: UserService, protected route: ActivatedRoute) {
    }

    afterInit(entityForm: any) {
        this.entityForm = entityForm;
        this.isNew = entityForm.isNew;

        const accessSet = _.find(this.fieldSets, { name : helptext.rsyncd_fieldset_access });

        this.rsyncmod_user = accessSet.config.find(config => config.name === 'user');
        this.userService.userQueryDSCache().subscribe((users) => {
            users.forEach((user) => {
                this.rsyncmod_user.options.push({label : user.username, value : user.username})
            });
        });

        this.rsyncmod_group = accessSet.config.find(config => config.name === 'group');
        this.userService.groupQueryDSCache().subscribe((groups) => {
            groups.forEach((group) => {
                this.rsyncmod_group.options.push({label : group.group, value : group.group})
            });
        });

        if (this.isNew) {
            entityForm.formGroup.controls['mode'].setValue('RO');
        }

        this.route.params.subscribe(params => {
            if (params['pk']) {
              this.pk = parseInt(params['pk'], 10);
              this.ws.call('rsyncmod.query', [
                [
                  ["id", "=", this.pk]
                ]
              ]).subscribe((res) => {
                for (const i in res[0]) {
                    if (i !== 'id') {
                        entityForm.formGroup.controls[i].setValue(res[0][i])
                    }
                };
              });
            };
        });

        if (!this.isNew) {
            entityForm.submitFunction = this.submitFunction;
        };
    }

    updateGroupSearchOptions(value = "", parent) {
        parent.userService.groupQueryDSCache(value).subscribe(items => {
            const groups = [];
            for (let i = 0; i < items.length; i++) {
                groups.push({ label: items[i].group, value: items[i].group });
            }
            parent.rsyncmod_group.searchOptions = groups;
        });
    }

    updateUserSearchOptions(value = "", parent) {
        parent.userService.userQueryDSCache(value).subscribe(items => {
            const users = [];
            for (let i = 0; i < items.length; i++) {
                users.push({ label: items[i].username, value: items[i].username });
            }
            parent.rsyncmod_user.searchOptions = users;
        });
    }

    submitFunction(entityForm: any){
        return this.ws.call('rsyncmod.update', [this.pk, entityForm]);
      };
}
