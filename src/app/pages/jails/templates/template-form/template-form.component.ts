import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';

import { EntityFormComponent } from '../../../common/entity/entity-form';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
	selector: 'app-jail-template-add',
	template: `<entity-form [conf]="this"></entity-form>`
})
export class TemplateFormComponent {

	protected resource_name: string = 'jails/templates';
  protected route_success: string[] = ['jails', 'templates'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'jt_name',
      placeholder: 'Name',
    },
    {
      type: 'select',
      name: 'jt_os',
      placeholder: 'OS',
      options: [
        { label: 'FreeBSD', value: 'FreeBSD' },
        { label: 'Linux', value: 'Linux' },
      ],
    },
    {
      type: 'select',
      name: 'jt_arch',
      placeholder: 'Architecture',
      options: [
        { label: 'x64', value: 'x64' },
        { label: 'x86', value: 'x86' },
      ],
    },
    {
      type: 'input',
      name: 'jt_url',
      placeholder: 'URL',
    },
    {
      type: 'input',
      name: 'jt_mtree',
      placeholder: 'Mtree',
    },
    {
      type: 'checkbox',
      name: 'jt_readonly',
      placeholder: 'Read-only',
    },
  ];

  constructor(protected router: Router, protected _injector: Injector, protected _appRef: ApplicationRef, protected _state: GlobalState) {

  }

  afterInit(entityForm: any) {
    if (!entityForm.isNew) {
      entityForm.setDisabled('jt_name', true);
    }
  }
}