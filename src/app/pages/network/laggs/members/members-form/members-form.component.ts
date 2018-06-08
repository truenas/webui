import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Validators} from '@angular/forms';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../../services/';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../../translate-marker';

@Component({
  selector : 'app-lagg-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class LaggMembersFormComponent {

  protected resource_name: string = 'network/lagginterfacemembers/';
  protected custom_get_query: string;
  protected custom_edit_query:string;
  protected route_success: string[] = [];
  protected isEntity: boolean = true;
  protected isNew: boolean;
  protected pk;
  protected nic;
  protected id;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'id',
      placeholder : T("Id"),
      isHidden: true
    },
    {
      type : 'select',
      name : 'lagg_interfacegroup',
      placeholder : T('Lagg Interface Group'),
      options : [],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'lagg_ordernum',
      inputType: 'number',
      placeholder : T('Lagg Priority Number'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'lagg_physnic',
      placeholder : T('Lagg Physical NIC'),
      options : [],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'lagg_deviceoptions',
      placeholder : T('Options'),
      required: true,
      validation : [ Validators.required ]
    },
  ];

  private lagg_interfacegroup: any;
  private lagg_physnic: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected route: ActivatedRoute,
              protected networkService: NetworkService) {}

  preInit(entityForm: any) {
    this.lagg_interfacegroup = _.find(this.fieldConfig, {'name' : 'lagg_interfacegroup'});
    this.lagg_physnic = _.find(this.fieldConfig, {'name' : 'lagg_physnic'});
    this.route.params.subscribe(params => {
      this.nic = params['nic'];
      this.pk = params['pk'];
      this.id = params['id'];
      this.route_success = [ 'network', 'laggs', this.pk, 'members'];
      if (this.id) {
        this.isNew = false;
        this.lagg_physnic.readonly = true;
        this.custom_get_query = this.resource_name + this.id + '/';
        this.custom_edit_query = this.resource_name + this.id + '/';
        this.lagg_interfacegroup.readonly = true;
      } else {
        this.isNew = true;
        this.lagg_physnic.type = 'select';
      }
    });
    this.rest.get('/network/lagg/', {}).subscribe((res) => {
      for (let i = 0; i < res.data.length; i++) {
        let label = res.data[i]['lagg_interface'] + ': ' + res.data[i]['lagg_protocol']
        this.lagg_interfacegroup.options.push({label : label, value: res.data[i].id});
      }
    });
  }

  afterInit(entityForm: any) {
    if (!this.id) {
      this.networkService.getLaggNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.lagg_physnic.options.push({label : item[1], value : item[0]});
        });
      });
    } 
  }
}
