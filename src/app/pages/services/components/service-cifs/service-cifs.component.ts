import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {  DynamicFormControlModel,
          DynamicFormArrayGroupModel, 
          DynamicFormService, 
          DynamicCheckboxModel, 
          DynamicCheckboxGroupModel,
          DynamicInputModel,
          DynamicSelectModel,
          DynamicRadioGroupModel,
          DynamicTextAreaModel,
          DynamicFormArrayModel,
          DynamicFormGroupModel
} from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, IscsiService, IdmapService } from '../../../../services/';
import { FormGroup, FormArray } from '@angular/forms';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component ({
    selector: 'cifs-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
    providers: [IscsiService, IdmapService],
})

export class ServiceCIFSComponent {
  protected resource_name: string = 'services/cifs';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected arrayControl: FormArray;
  protected arrayModel: DynamicFormArrayModel;
  private ip: DynamicSelectModel<string>;
  protected ipChoice: any;

  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'cifs_srv_netbiosname',
      label: 'NetBIOS Name',
    }),
    new DynamicInputModel({
        id: 'cifs_srv_netbiosalias',
        label: 'NetBIOS Alias',
    }),
    new DynamicInputModel({
        id: 'cifs_srv_workgroup',
        label: 'Workgroup',
    }),
    new DynamicInputModel({
        id: 'cifs_srv_description',
        label: 'Description',
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_doscharset',
      label: 'DOS Charset',
      options: [
        { label: 'CP437', value: 'CP437'},
        { label: 'CP850', value: 'CP850'},
        { label: 'CP852', value: 'CP852'},
        { label: 'CP866', value: 'CP866'},
        { label: 'CP932', value: 'CP932'},
        { label: 'CP949', value: 'CP949'},
        { label: 'CP950', value: 'CP950'},
        { label: 'CP1026', value: 'CP1026'},
        { label: 'CP1251', value: 'CP1251'},
        { label: 'ASCII', value: 'ASCII'},
      ],
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_unixcharset',
      label: 'UNIX Charset',
      options: [
        { label: 'UTF-8', value: 'CP437'},
        { label: 'iso-8859-1', value: 'iso-8859-1'},
        { label: 'iso-8859-15', value: 'iso-8859-15'},
        { label: 'gb2312', value: 'gb2312'},
        { label: 'EUC-JP', value: 'EUC-JP'},
        { label: 'ISCII', value: 'ISCII'},
      ],
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_loglevel',
      label: 'Log Level',
      options: [
        { label: 'None', value: 0},
        { label: 'Minimum', value: 1},
        { label: 'Normal', value: 2},
        { label: 'Full', value: 3},
        { label: 'Debug', value: 10},
      ],
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_syslog',
      label: 'Use syslog only',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_localmaster',
      label: 'Local Master',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_domain_logons',
      label: 'Domain Logons',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_timeserver',
      label: 'Time Server For Domain',
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_guest',
      label: 'Guest Account',
    }),
    new DynamicInputModel({
        id: 'cifs_srv_filemask',
        label: 'File Mask',
    }),
    new DynamicInputModel({
        id: 'cifs_srv_dirmask',
        label: 'Directory Mask',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_nullpw',
      label: 'Allow Empty Password',
    }),
    new DynamicTextAreaModel({
      id: 'cifs_srv_smb_options',
      label: 'Auxiliary Parameters',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_unixext',
      label: 'Unix Extensions',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_zeroconf',
      label: 'Zeroconf share discovery',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_hostlookup',
      label: 'Hostnames Lookups',
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_min_protocol',
      label: 'Server Minimum Protocol',
    }),
    new DynamicSelectModel({
      id: 'cifs_srv_max_protocol',
      label: 'Server Maximum Protocol',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_allow_execute_always',
      label: 'Allow Execute Always',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_obey_pam_restrictions',
      label: 'Obey Pam Restrictions',
    }),
    new DynamicCheckboxModel({
      id: 'cifs_srv_ntlmv1_auth',
      label: 'NTLMv1 Auth',
    }),
    new DynamicFormArrayModel(
      {
        id: "bindips",
        label: 'Bind IP Addresses',
        initialCount: 1,
        createGroup: () => {
            return [
                new DynamicSelectModel({
      
                    id: "cifs_srv_bindip",
                    label: "Form Array Input"
                })
            ];
        }
      }
    ), 
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected iscsiService: IscsiService, protected idmapService: IdmapService) {
  }

  setIpFormArray(groupModel: DynamicFormArrayGroupModel) {
    this.ip = <DynamicSelectModel<string>>groupModel.group[0];
    this.ipChoice.forEach((item) => {
      this.ip.add({ label: item[1], value: item[0] });
    });
  }  

  afterInit(entityEdit: EntityConfigComponent) {
    this.entityEdit = entityEdit;
    this.arrayControl = <FormArray> entityEdit.formGroup.get("bindips");
    this.arrayModel = <DynamicFormArrayModel> this.formService.findById("bindips", this.formModel);
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.ipChoice = res;
      for(let i in this.arrayModel.groups) {
        this.setIpFormArray(this.arrayModel.groups[i]);
      }
    });
    this.idmapService.getADIdmap().subscribe((res) => {
      console.log(res);
    })
  }

  ngOnInit() {
  }
}



