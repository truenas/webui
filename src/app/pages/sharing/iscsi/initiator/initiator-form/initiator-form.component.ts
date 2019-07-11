import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import {EntityFormService} from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector : 'app-iscsi-initiator-form',
  templateUrl: './initiator-form.component.html',
  styleUrls: ['./initiator-form.component.css', '../../../../common/entity/entity-form/entity-form.component.scss']
})
export class InitiatorFormComponent implements OnInit{

  protected addCall: string = 'iscsi.initiator.create';
  protected queryCall: string = 'iscsi.initiator.query';
  protected editCall = 'iscsi.initiator.update';
  protected customFilter: Array<any> = [[["id", "="]]];
  public route_success: string[] = [ 'sharing', 'iscsi', 'initiator' ];
  protected isEntity: boolean = true;
  protected pk: any;
  protected entityForm: any;

  public allowAllInitiatorsField = {
    type : 'checkbox',
    name : 'all',
    placeholder : 'Allow all initiators',
    tooltip: '',
  };
  public initiatorsField = {
    type : 'input-list',
    name : 'initiators',
    placeholder : 'Allowed Initiators (IQN)',
    tooltip: helptext_sharing_iscsi.initiator_form_placeholder_initiators,
    onDrop: (parent) => {
      for (let i = 0; i < parent.source.selectedOptions.selected.length; i++) {
        parent.listControl.value.add(parent.source.selectedOptions.selected[i].value.initiator);
      }
      parent.source.deselectAll();
    }
  };
  public authnetworkField = {
    type : 'input-list',
    name : 'auth_network',
    placeholder : helptext_sharing_iscsi.initiator_form_placeholder_auth_network,
    tooltip: helptext_sharing_iscsi.initiator_form_placeholder_auth_network,
    onDrop: (parent) => {
      for (let i = 0; i < parent.source.selectedOptions.selected.length; i++) {
        parent.listControl.value.add(parent.source.selectedOptions.selected[i].value.initiator_addr);
      }
      parent.source.deselectAll();
    }
  };

  public commentField = {
    type : 'input',
    name : 'comment',
    placeholder : helptext_sharing_iscsi.initiator_form_placeholder_comment,
    tooltip: helptext_sharing_iscsi.initiator_form_tooltip_comment,
  };

  public formGroup;
  public connectedInitiators;

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected loader: AppLoaderService, protected ws: WebSocketService,
    protected entityFormService: EntityFormService,) {}

  ngOnInit() {
    this.ws.call('iscsi.global.sessions').subscribe((res) => {
      console.log(res);
      this.connectedInitiators = [...res, ...res, ...res, ...res, ...res];
    })
    this.formGroup = this.entityFormService.createFormGroup([this.allowAllInitiatorsField, this.initiatorsField, this.authnetworkField, this.commentField]);
  }

  onSubmit(event) {
    console.log('submit', this.formGroup.value);
    let value = this.formGroup.value;
    
  }
}
