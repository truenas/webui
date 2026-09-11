import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import {
  injectTnFormFieldAria, TnSelectComponent, TnSelectOption, TnTestIdDirective,
} from '@truenas/ui-components';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { NetworkService } from 'app/services/network.service';

@Component({
  selector: 'ix-ip-input-with-netmask',
  templateUrl: './ix-ip-input-with-netmask.component.html',
  styleUrls: ['./ix-ip-input-with-netmask.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TnSelectComponent,
    TnTestIdDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxIpInputWithNetmaskComponent implements ControlValueAccessor {
  private network = inject(NetworkService);
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);

  readonly required = input<boolean>(false);
  /**
   * Explicit accessible name, for the rare standalone use with no enclosing `tn-form-field`.
   * Inside a field, leave it unset: the field's own label names the address input through
   * `aria-labelledby`, and setting this would override it.
   */
  readonly ariaLabel = input<string>();

  /**
   * ARIA wiring from the enclosing `tn-form-field`. This control renders no label of its own —
   * the field owns the label row, which is what makes it line up with the `tn-input`s beside it —
   * so the field names the address input. All-null standalone.
   */
  protected readonly fieldAria = injectTnFormFieldAria(this.ariaLabel);

  onChange: (value: string) => void = (): void => {};
  onTouched: () => void = (): void => {};

  isDisabled = false;
  address = '';
  netmask = '';

  netmaskOptions: TnSelectOption<string>[] = this.mapNetmaskOptions(this.network.getV4Netmasks());

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  onAddressInput(inputElement: HTMLInputElement): void {
    this.address = inputElement.value;
    this.onValueChanged();
    this.setNetmaskOptions();
  }

  onNetmaskChange(value: string): void {
    this.netmask = value;
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

  private setAddressAndNetmask(ipWithNetmask: string | null): void {
    const [address, netmask] = (ipWithNetmask || '').split('/');
    this.address = address;
    this.netmask = netmask;
  }

  private setNetmaskOptions(): void {
    const isIp6 = this.address.includes(':');
    if (isIp6) {
      this.netmaskOptions = this.mapNetmaskOptions(this.network.getV6PrefixLength());
    } else {
      this.netmaskOptions = this.mapNetmaskOptions(this.network.getV4Netmasks());
    }
  }

  // Netmask labels are display-ready (CIDR numbers / a placeholder), never translatable text, so
  // they pass through verbatim — the form control value is `${address}/${netmask}`.
  private mapNetmaskOptions(options: { label: string; value: string | number }[]): TnSelectOption<string>[] {
    return options.map((option) => ({
      label: option.label,
      value: String(option.value),
    }));
  }
}
