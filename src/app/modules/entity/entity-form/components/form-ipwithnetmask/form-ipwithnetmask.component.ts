import {
  Component, OnInit,
} from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { FormIpWithNetmaskConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';
import { NetworkService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './form-ipwithnetmask.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormIpWithNetmaskComponent implements Field, OnInit {
  config: FormIpWithNetmaskConfig;
  group: UntypedFormGroup;
  fieldShow: string;

  address = '';
  netmask = '24';
  netmaskOptions = this.network.getV4Netmasks();
  value: string;

  private ipv6netmaskoptions = this.network.getV6PrefixLength();
  private ipv4netmaskoptions = this.network.getV4Netmasks();
  private control: AbstractControl;

  constructor(public translate: TranslateService, public network: NetworkService) {
  }

  ngOnInit(): void {
    this.control = this.group.controls[this.config.name];
    this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.setAddressAndNetmask(res);
    });
    if (this.control.value) {
      this.setAddressAndNetmask(this.control.value);
    }
  }

  setAddress($event: FocusEvent): void {
    const address = ($event.target as HTMLInputElement).value;
    this.setAddressAndNetmask(address);
  }

  setNetmaskOptions(): void {
    if (!this.address.includes(':')) {
      this.netmaskOptions = this.ipv4netmaskoptions;
    } else {
      this.netmaskOptions = this.ipv6netmaskoptions;
    }
  }

  setNetmask($event: MatSelectChange): void {
    this.netmask = $event.value;
    this.setValue();
  }

  setValue(): void {
    let value = this.address + '/' + this.netmask;
    if (this.address.trim() === '' || this.address === undefined) {
      value = '';
    }
    if (value !== this.value) {
      this.value = value;
      this.control.setValue(value);
    }
  }

  setAddressAndNetmask(value: string): void {
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
