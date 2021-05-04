import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Validators } from '@angular/forms';

import * as _ from 'lodash';
import helptext from '../../../../helptext/account/groups';

import { WebSocketService, UserService } from '../../../../services';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';

@Component({
  selector: 'app-group-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class GroupFormComponent {
  protected isEntity = true;
  protected namesInUse: string[] = [];
  protected queryCall = 'group.query';
  protected addCall = 'group.create';
  protected editCall = 'group.update';
  protected queryKey = 'id';
  title: string;
  protected isOneColumnForm = true;
  protected fieldConfig: FieldConfig[] = [];

  fieldSetDisplay = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_name,
      class: 'group-configuration-form',
      label: true,
      config: [
        {
          type: 'input',
          name: 'gid',
          placeholder: helptext.bsdgrp_gid_placeholder,
          tooltip: helptext.bsdgrp_gid_tooltip,
          validation: helptext.bsdgrp_gid_validation,
          required: true,
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.bsdgrp_group_placeholder,
          tooltip: helptext.bsdgrp_group_tooltip,
          validation: [
            Validators.required,
            Validators.pattern(UserService.VALIDATOR_NAME),
            forbiddenValues(this.namesInUse),
          ],
          required: true,
        },
        {
          type: 'checkbox',
          name: 'sudo',
          placeholder: helptext.bsdgrp_sudo_placeholder,
          tooltip: helptext.bsdgrp_sudo_tooltip,
        },
        {
          type: 'checkbox',
          name: 'smb',
          placeholder: helptext.smb_placeholder,
          tooltip: helptext.smb_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'allow_duplicate_gid',
          placeholder: helptext.allow_placeholder,
          tooltip: helptext.allow_tooltip,
          disabled: false,
        },
      ],
    },
  ];

  private bsdgrp_gid: any;

  constructor(
    protected router: Router,
    protected ws: WebSocketService,
    private modalService: ModalService,
  ) {}

  resourceTransformIncomingRestData(data: any) {
    data['name'] = data['group'];
    this.getNamesInUse(data['name']);
    return data;
  }

  getNamesInUse(currentName?: string) {
    this.ws.call('group.query').subscribe((groups) => {
      if (currentName) {
        _.remove(groups, (group) => group.group == currentName);
      }
      this.namesInUse.push(...groups.map((group) => group.group));
    });
  }

  afterInit(entityForm: any) {
    this.bsdgrp_gid = _.find(this.fieldSets[0].config, { name: 'gid' });

    if (!entityForm.isNew) {
      entityForm.setDisabled('gid', true);

      entityForm.formGroup.controls['allow_duplicate_gid'].setValue(true);
      _.find(this.fieldSets[0].config, { name: 'allow_duplicate_gid' }).isHidden = true;
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
      this.getNamesInUse();
      this.ws.call('group.get_next_gid').subscribe((res) => {
        entityForm.formGroup.controls['gid'].setValue(res);
      });
    }
  }

  afterSubmit() {
    this.modalService.refreshTable();
  }
}
