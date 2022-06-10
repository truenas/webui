import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { NetworkService } from 'app/services';

@Component({
  selector: 'ix-ip-input-with-netmask',
  templateUrl: './ix-ip-input-with-netmask.component.html',
  styleUrls: ['./ix-ip-input-with-netmask.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxIpInputWithNetmaskComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  onChange: (value: string) => void = (): void => {};
  onTouched: () => void = (): void => {};

  isDisabled = false;
  address = '';
  netmask = '';

  netmaskOptions = this.network.getV4Netmasks();

  constructor(
    private network: NetworkService,
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onAddressInput(input: HTMLInputElement): void {
    this.address = input.value;
    this.onValueChanged();
    this.setNetmaskOptions();
  }

  onNetmaskChange($event: MatSelectChange): void {
    this.netmask = $event.value;
    this.onValueChanged();
  }

  writeValue(ipWithNetmask: string): void {
    this.setAddressAndNetmask(ipWithNetmask);
    this.setNetmaskOptions();
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  private onValueChanged(): void {
    let value = this.address + '/' + this.netmask;
    if (this.address.trim() === '' || this.address === undefined) {
      value = '';
    }

    this.onChange(value);
  }

  private setAddressAndNetmask(ipWithNetmask: string): void {
    ipWithNetmask = ipWithNetmask || '';
    const [address, netmask] = ipWithNetmask.split('/');
    this.address = address;
    this.netmask = netmask;
  }

  private setNetmaskOptions(): void {
    const isIp6 = this.address.includes(':');
    if (isIp6) {
      this.netmaskOptions = this.network.getV6PrefixLength();
    } else {
      this.netmaskOptions = this.network.getV4Netmasks();
    }
  }
}
