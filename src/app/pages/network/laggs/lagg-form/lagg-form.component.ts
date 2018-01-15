import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

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
      placeholder : 'Lagg Interface',
    },
    {
      type : 'select',
      name : 'lagg_protocol',
      placeholder : 'Lagg Protocol',
      tooltip : 'Select the desired Protocol Type. LACP is preferred.\
 If the network switch does not support LACP, choose Failover.',
      options : []
    },
    {
      type : 'select',
      name : 'lagg_interfaces',
      placeholder : 'Lagg Interfaces',
      options : [],
      multiple : true
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
