import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Validators} from '@angular/forms';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-lagg-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class LaggFormComponent {

  protected resource_name: string = 'network/lagg/';
  protected route_success: string[] = [ 'network', 'laggs' ];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'lagg_interface',
      placeholder : T('Lagg Interface'),
      tooltip : T('Enter a descriptive name for the new interface.'),
    },
    {
      type : 'select',
      name : 'lagg_protocol',
      placeholder : T('Lagg Protocol'),
      tooltip : T('Select the desired Protocol Type. <i>LACP</i> is\
                   recommended if the switch is configured for <i>active\
                   LACP</i>. Choose <i>Failover</i> if the network\
                   switch does not support acive LACP.'),
      options : [],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'lagg_interfaces',
      placeholder : T('Lagg Interfaces'),
      tooltip : T('Choose network interfaces to use in the aggregation.\
                   <b>Warning:</b> Lagg creation fails if the interfaces\
                   are manually configured.'),
      options : [],
      multiple : true,
      required: true,
      validation : [ Validators.required ]
    },
  ];

  private lagg_interface: any;
  private lagg_interfaces: any;
  private lagg_protocol: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}

  afterInit(entityForm: any) {
    this.networkService.getLaggProtocolTypes().subscribe((res) => {
      this.lagg_protocol = _.find(this.fieldConfig, {'name' : 'lagg_protocol'});
      res.forEach((item) => {
        this.lagg_protocol.options.push({label : item[1], value : item[0]});
      });
    });

    if (entityForm.isNew) {
      this.lagg_interfaces =
          _.find(this.fieldConfig, {'name' : 'lagg_interfaces'});
      this.networkService.getLaggNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.lagg_interfaces.options.push({label : item[1], value : item[0]});
        });
      });
    }
  }
}
