import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

@Injectable()
export class InterfaceNameValidatorService {
  constructor(
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
  ) {}

  validate: ValidatorFn = (control: AbstractControl<string>): ValidationErrors => {
    if (!control.parent) {
      return null;
    }

    const type = (control.parent.value as { type: NetworkInterfaceType }).type;
    const isPrefixRequired = [
      NetworkInterfaceType.Bridge,
      NetworkInterfaceType.LinkAggregation,
      NetworkInterfaceType.Vlan,
    ].includes(type);

    if (control.value === '' || control.value === undefined || !isPrefixRequired) {
      return null;
    }

    const prefix = this.getNamePrefix(type);
    const validator = this.validatorsService.withMessage(
      Validators.pattern(`^${prefix}\\d+$`),
      this.getNameFormatMessage(type),
    );

    return validator(control);
  };

  getNameFormatMessage(type: NetworkInterfaceType): string {
    const prefix = this.getNamePrefix(type);
    let interfaceName: string;
    switch (type) {
      case NetworkInterfaceType.Bridge:
        interfaceName = this.translate.instant('Bridge interface');
        break;
      case NetworkInterfaceType.LinkAggregation:
        interfaceName = this.translate.instant('Link aggregation interface');
        break;
      case NetworkInterfaceType.Vlan:
        interfaceName = this.translate.instant('VLAN interface');
        break;
      default:
        console.error('Unsupported interface type', type);
    }

    return this.translate.instant(
      '{interfaceName} must start with "{prefix}" followed by an unique number',
      { prefix, interfaceName },
    );
  }

  getNamePrefix(type: NetworkInterfaceType): string {
    switch (type) {
      case NetworkInterfaceType.Bridge:
        return 'br';
      case NetworkInterfaceType.LinkAggregation:
        return 'bond';
      case NetworkInterfaceType.Vlan:
        return 'vlan';
      default:
        return '';
    }
  }
}
