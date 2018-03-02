import { Component, ViewContainerRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { FormGroup, Validators } from '@angular/forms';
import { FieldConfig } from '../../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-rsync-configuration-form',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class RYSNCConfigurationFormComponent {
    protected resource_name = 'services/rsyncmod/';
    protected addCall = 'rsyncmod.create';
    protected route_success: string[] = [ 'rsync','rsync-module' ];
    protected isEntity = true;
    public formGroup: FormGroup;
    public fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'name',
        placeholder: 'Name',
        tooltip: ''
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
    },
    {
        type: 'select',
        name: 'mode',
        placeholder: 'Access Mode',
        options: [],
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
        tooltip: ''
      },
      {
        type: 'textarea',
        name: 'hostsdeny',
        placeholder: 'Hosts Deny',
        tooltip: ''
      },
      {
        type: 'textarea',
        name: 'auxiliary',
        placeholder: 'Auxiliary parameters',
        tooltip: ''
      },


    ]
    afterInit(entityForm: any) {
        entityForm.submitFunction = this.submitFunction;

    }
    submitFunction(){
        const auxPayLoad = []
        const payload = {};
        const formvalue = _.cloneDeep(this.formGroup.value);
        console.log(formvalue);
    }

}