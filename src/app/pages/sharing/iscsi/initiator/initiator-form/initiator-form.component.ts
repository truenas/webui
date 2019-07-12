import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import {EntityFormService} from '../../../../common/entity/entity-form/services/entity-form.service';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import * as _ from 'lodash';

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
  protected pk: any;

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
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });

    this.ws.call('iscsi.global.sessions').subscribe((res) => {
      console.log(res);
      this.connectedInitiators = [...res, ...res, ...res, ...res, ...res];
    })
    this.formGroup = this.entityFormService.createFormGroup([this.allowAllInitiatorsField, this.initiatorsField, this.authnetworkField, this.commentField]);

    if (this.pk) {
      this.ws.call(this.queryCall, this.customFilter).subscribe(
        (res) => {
          console.log(res);
          for (const i in res[0]){
            const ctrl = this.formGroup.controls[i];
            if (ctrl) {
              if (i == 'initiators' || i == 'auth_network') {
                ctrl.setValue(new Set(res[0][i]));
              } else {
                ctrl.setValue(res[0][i]);
              }
            }
          }
        },
        (err) => {
          new EntityUtils().handleWSError(this, err);
        })
    }
  }

  onSubmit(event) {
    console.log('submit', this.formGroup.value);
    const value = _.cloneDeep(this.formGroup.value);

    value['initiators'] = Array.from(value['initiators']);
    value['auth_network'] = Array.from(value['auth_network']);
    delete value['initiators_input'];
    delete value['auth_network_input'];
    let submitFunction;
    if (this.pk === undefined) {
      submitFunction = this.ws.call(this.addCall, [value]);
    } else {
      submitFunction = this.ws.call(this.editCall, [this.pk, value])
    }

    this.loader.open();
    submitFunction.subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err);
      }
    )
  }

  goBack() {
    this.router.navigate(new Array('/').concat(this.route_success));
  }
}
