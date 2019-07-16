import { Component, Output, ViewChild, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { NetworkService } from '../../../../../../services';

@Component({
  selector: 'form-ipwithnetmask',
  templateUrl: './form-ipwithnetmask.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.css'],
})
export class FormIpWithNetmaskComponent implements Field, OnInit, OnDestroy {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  address = '';
  netmask: string;
  netmaskOptions = this.network.getV4Netmasks();
  value: string;
  netmaskPreset: number

  private ipv6netmaskoptions = this.network.getV6PrefixLength();
  private ipv4netmaskoptions = this.network.getV4Netmasks();
  private valueSubscription: any;
  private control: any;

  constructor(public translate: TranslateService, private network: NetworkService) {
  }

  ngOnInit() {
    this.control = this.group.controls[this.config.name];
    this.valueSubscription = this.control.valueChanges.subscribe((res) => {
      this.setAddressAndNetmask(res);
    });
    if (this.control.value) {
      this.setAddressAndNetmask(this.control.value);
    }
  }

  ngOnDestroy() {
    this.valueSubscription.unsubscribe();
  }

  setAddress($event){
    const address = $event.target.value;
    this.setAddressAndNetmask(address);
  }

  setNetmaskOptions() {
    if (this.address.indexOf(':') === -1) {
      this.netmaskOptions = this.ipv4netmaskoptions;
    }  else {
      this.netmaskOptions = this.ipv6netmaskoptions;
    }
  }

  setNetmask($event){
    this.netmask = $event.value;
    this.setValue();
  }

  setValue() {
    const value = this.address + "/" + this.netmask;
    if (value !== this.value) {
      this.value = value;
      this.control.setValue(value);
    }
  }

  setAddressAndNetmask(value) {
    const strings = value.split('/');
    this.address = strings[0];
    if (strings.length > 1) {
      this.netmask = strings[1];
    } else if (this.config.netmaskPreset) {
      this.netmask = (this.config.netmaskPreset).toString();
    }
    this.setNetmaskOptions();
    this.setValue();
  }
}
