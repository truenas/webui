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
    if (this.control.value && this.network.ipv4_or_ipv6_cidr.test(this.control.value)) {
      this.setAddressAndNetmask(this.control.value);
    }
  }

  ngOnDestroy() {
    this.valueSubscription.unsubscribe();
  }

  setAddress($event){
    const address = $event.target.value;
    if (address.match(this.network.ipv4_or_ipv6_cidr)) {
      this.setAddressAndNetmask(address);
    } else {
      this.address = address;
    }
    if (this.address.indexOf(':') === -1) {
      this.netmaskOptions = this.ipv4netmaskoptions;
    }  else {
      this.netmaskOptions = this.ipv6netmaskoptions;
    }
    this.setValue();
  }

  setNetmask($event){
    this.netmask = $event.value;
    this.setValue();
  }

  setValue() {
    this.control.setValue(this.address + "/" + this.netmask);
  }

  setAddressAndNetmask(value) {
    const strings = value.split('/');
    this.address = strings[0];
    this.netmask = strings[1];
  }
}
