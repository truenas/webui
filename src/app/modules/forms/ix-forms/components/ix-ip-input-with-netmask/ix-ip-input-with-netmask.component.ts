import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnSelectComponent, TnSelectOption } from '@truenas/ui-components';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { NetworkService } from 'app/services/network.service';

@Component({
  selector: 'ix-ip-input-with-netmask',
  templateUrl: './ix-ip-input-with-netmask.component.html',
  styleUrls: ['./ix-ip-input-with-netmask.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    FormsModule,
    ReactiveFormsModule,
    TnSelectComponent,
    IxErrorsComponent,
    TranslateModule,
    TestDirective,
    TestOverrideDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxIpInputWithNetmaskComponent implements ControlValueAccessor {
  private network = inject(NetworkService);
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);

  readonly label = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly required = input<boolean>(false);

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

  private mapNetmaskOptions(options: { label: string; value: string | number }[]): TnSelectOption<string>[] {
    return options.map((option) => ({
      label: this.translate.instant(option.label),
      value: String(option.value),
    }));
  }
}
