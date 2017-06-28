import { ApplicationRef, Component, Injector, Input, OnDestroy, OnInit, ViewChildren } from '@angular/core';
import { FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DynamicFormControlModel, DynamicFormService, DynamicFormArrayModel } from '@ng2-dynamic-forms/core';
import { RestService, WebSocketService } from '../../../../services/';
import { Location } from '@angular/common';

import { Subscription } from 'rxjs';
import { EntityUtils } from '../utils';

import * as _ from 'lodash';

@Component({
  selector: 'entity-edit',
  templateUrl: './entity-edit.component.html',
  styleUrls: ['./entity-edit.component.css']
})
export class EntityEditComponent implements OnInit, OnDestroy {

  @Input('conf') conf: any;

  protected pk: any;
  public formGroup: FormGroup;

  @ViewChildren('component') components;

  public busy: Subscription;

  public sub: any;
  public error: string;
  public data: Object = {};
  public ip_arr_count: number = 0;
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService, protected ws: WebSocketService, protected formService: DynamicFormService, protected _injector: Injector, protected _appRef: ApplicationRef, protected location: Location) {

  }

  ngOnInit() {
    this.formGroup = this.formService.createFormGroup(this.conf.formModel);
    if (this.conf.preInit){
      this.conf.preInit(this);
    }
    this.sub = this.route.params.subscribe(params => {
      this.pk = params['pk'];
      var get_query = this.conf.resource_name + '/' + this.pk + '/';
      if (this.conf.custom_get_query) {
        get_query = this.conf.custom_get_query;
      }
      this.rest.get(get_query, {}).subscribe((res) => {
        this.data = res.data;
        for(let i in this.data) {
          let fg = this.formGroup.controls[i];
          if(fg) {
            if(Array.isArray(this.data[i])) {
              this.setIps(this.data[i]);
            } else {
              fg.setValue(this.data[i]);
            }
          }
        }
        if(this.conf.initial) {
          this.conf.initial.bind(this.conf)(this);
        }
      })
    });

    if (this.conf.afterInit){
      this.conf.afterInit(this);
    }
  }

  goBack() {
    let route = this.conf.route_cancel;
    if(!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/pages').concat(route));
  }

  setIps(data: any[]) {
    this.ip_arr_count = 0;
    for(let i in data) {
      var ip_arr: any[] = _.split(data[i], ':');
      var ip = ip_arr[0];
      var port = ip_arr[1];

      var arrayControl = <FormArray> this.formGroup.get("iscsi_target_portal_ips");
      var arrayModel = <DynamicFormArrayModel> this.formService.findById("iscsi_target_portal_ips", this.conf.formModel);
      this.ip_arr_count += 1;
      this.formService.insertFormArrayGroup(this.ip_arr_count, arrayControl, arrayModel);

      arrayControl.controls[i].get("ip").setValue(ip);
      arrayControl.controls[i].get("port").setValue(port);
    }
  }

  getIPs(data: any[]):any[] {
    var IPs = new Array();
    for(let i in data) {
      if('ip' in data[i] && 'port' in data[i] && 'delete' in data[i]) {
        if(!data[i]['delete']) {
          let ip = data[i]['ip'] + ':' + data[i]['port'];
          IPs.push(ip);
        }
      }
    }
    return IPs;
  }

  onSubmit() {
    this.error = null;
    let value = _.cloneDeep(this.formGroup.value);
    for(let i in value) {
      let clean = this['clean_' + i];
      if(clean) {
        value = clean(value, i);
      }

      if(Array.isArray(value[i])) {
        value[i] = this.getIPs(value[i]);
      }
    }
    if('id' in value) {
      delete value['id'];
    }

    if(this.conf.clean) {
      value = this.conf.clean.bind(this.conf)(value);
    }

    var edit_query = this.conf.resource_name + '/' + this.pk + '/'
    if (this.conf.custom_edit_query) {
      edit_query = this.conf.custom_edit_query;
    }

    this.busy = this.rest.put(edit_query, {
      body: JSON.stringify(value),
    }).subscribe((res) => {
      this.router.navigate(new Array('/pages').concat(this.conf.route_success));
    }, (res) => {
      new EntityUtils().handleError(this, res);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  isShow(id:any):any {
    if (this.conf.isBasicMode) {
      if (this.conf.advanced_field.indexOf(id) > -1) {
        return false;
      }
    }
    return true;
  }

}
