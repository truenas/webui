import { Inject, Injectable } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({ providedIn: 'root' })
export class IxFormatterService {
  readonly protocol = this.window?.location?.protocol || 'http:';
  readonly iecUnits: readonly string[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  constructor(@Inject(WINDOW) private window: Window) {}

  /**
   * Formats any memory size in bytes to human readable string, e.g., '2147483648' to '2 GiB'
   * @param value The string to be formatted
   * @returns Formatted string
   */
  memorySizeFormatting: (val: string | number) => string = (value: string | number) => {
    if (!value) {
      return '';
    }
    value = value.toString();
    return !value || Number.isNaN(Number(value)) ? '' : this.convertBytesToHumanReadable(value, 2);
  };

  /**
   * Parses passed in human readable memory size string into a normalized value.
   * If no units are provided, MiB is used as default unit
   * @param value The value to be parsed
   * @returns The parsed value
   */
  memorySizeParsing: (val: string, postfixValue?: string) => number = (value: string, postfix: string) => {
    if (!value) {
      return null;
    }

    const finalValue = `${value} ${!Number(value) ? '' : postfix || ''}`.trim();
    const humanStringToNum = this.convertHumanStringToNum(finalValue, true);

    // Default unit is MiB so if the user passed in no unit, we assume unit is MiB
    return (humanStringToNum !== Number(finalValue)) ? humanStringToNum : this.convertHumanStringToNum(finalValue + 'mb', true);
  };

  /**
   * Converts a number from bytes to the most natural human readable format
   * @param rawBytes Bytes to be converted
   * @param decimalPlaces Number of decimal places that the final value should be rounded off to
   * @param minUnits If no unit is provided, what minimum base unit should be assumed
   * @param hideBytes If the value is in bytes, should the 'B' sign be added
   * @returns A human readable string with appropriate units
   */
  convertBytesToHumanReadable = (
    rawBytes: number | string,
    decimalPlaces?: number,
    minUnits?: string,
    hideBytes?: boolean,
  ): string => {
    let i = 0;
    let units;
    let bytes = Number(rawBytes);

    const dec = decimalPlaces !== undefined ? decimalPlaces : 2;
    if (bytes >= 1024) {
      do {
        bytes = bytes / 1024;
        i++;
      } while (bytes >= 1024 && i < 4);
      units = this.iecUnits[i];
    } else if (minUnits) {
      units = minUnits;
    } else {
      units = hideBytes ? '' : 'B';
    }
    return `${parseFloat(bytes.toFixed(dec))} ${units}`;
  };

  /**
   * Converts a human readable size string with units into bytes. Any invalid letters result in null returned
   * @param hstr The string to be converted
   * @param dec Does the passed string has a decimal point values
   * @param allowedUnits allowedUnits should include any or all of 'bkmgtp', the first letters of KiB, Mib, etc.
   * The first letter is used as the default, so for 'gtp', an entered value of 256 becomes 256 GiB.
   * If you don't pass in allowedUnits, all of the above are accepted AND no unit is attached to an unlabeled number,
   * so 256 is considered 256 bytes.
   * @returns The passed human readable string converted into number of bytes
   */
  convertHumanStringToNum = (
    hstr: string,
    dec = false,
    allowedUnits?: 'bkmgtp' | 'kmgtp' | 'mgtp' | 'gtp' | 'tp' | 'p',
  ): number => {
    const { unit, number } = this.getNumberAndUnitFromHumanString(hstr, dec, allowedUnits);

    return number === null ? null : Number(number) * this.convertUnitToNum(unit);
  };

  /**
   * Converts passed in human readable string into two parts. The digit value in numbers and the unit that's applied.
   * @param hstr The human readable size string
   * @param dec Does the value has decimal point values
   * @param allowedUnits allowedUnits should include any or all of 'bkmgtp', the first letters of KiB, Mib, etc.
   * The first letter is used as the default, so for 'gtp', an entered value of 256 becomes 256 GiB.
   * If you don't pass in allowedUnits, all of the above are accepted AND no unit is attached to an unlabeled number,
   * so 256 is considered 256 bytes.
   * @returns The passed human readable string converted into number and unit seperately
   */
  getNumberAndUnitFromHumanString(
    hstr: string,
    dec = false,
    allowedUnits?: 'bkmgtp' | 'kmgtp' | 'mgtp' | 'gtp' | 'tp' | 'p',
  ): { number: string; unit: string } {
    let num;
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
      return { number: null, unit: null };
    }

    // remove whitespace
    hstr = hstr.replace(/\s+/g, '');

    // get leading number
    let match = [];
    if (dec) {
      match = hstr.match(/^(\d+(\.\d+)?)/);
    } else {
      match = hstr.match(/^(\d+)/);
    }
    if (match && match.length > 1) {
      num = match[1];
    } else {
      // leading number is required
      return { number: null, unit: null };
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if (!unit && allowedUnits) {
      unit = allowedUnits[0];
    }

    const normalizedUnit = this.normalizeUnit(unit);
    if (
      // error when unit is present and...
      (unit) && (
        // ...allowedUnits are passed in but unit is not in allowed Units
        (allowedUnits && !allowedUnits.toLowerCase().includes(unit[0].toLowerCase()))
        // ...when allowedUnits are not passed in and unit is not recognized
        || !normalizedUnit
      )
    ) {
      return { number: null, unit: null };
    }
    return { number: num, unit: normalizedUnit };
  }

  /**
   * Normalize short units ("MB") or human units ("M") to IEC units ("MiB")
   * @param unitStr The unit string to be normalized
   * @returns Normalized unit string based on the passed value
   */
  normalizeUnit = (unitStr: string): string => {
    // empty unit is valid, just return
    if (!unitStr) {
      return '';
    }

    const iecUnitsStr = this.iecUnits.join('|');
    const shortUnitsStr = this.iecUnits.map((unit) => {
      if (unit.length > 1) {
        return unit.charAt(0) + unit.charAt(2);
      }
      return 'BYTES';
    }).join('|');
    const humanUnitsStr = this.iecUnits.map((unit) => unit.charAt(0)).join('|');

    const allUnitsStr = (iecUnitsStr + '|' + shortUnitsStr + '|' + humanUnitsStr).toUpperCase();
    const unitsRe = new RegExp('^\\s*(' + allUnitsStr + '){1}\\s*$');

    unitStr = unitStr.toUpperCase();
    if (unitStr.match(unitsRe)) {
      // always return IEC units
      // could take a parameter to return short or human units
      if (unitStr.toLowerCase() === 'b' || unitStr.toLowerCase() === 'bytes') {
        return 'B';
      }
      return unitStr.charAt(0).toUpperCase() + 'iB';
    }
    return undefined;
  };

  /**
   * Convert IEC ("MiB"), short ("MB"), or human ("M") units to number of bytes. Unknown units are evaluated as 1
   * @param unitStr The unit string to be converted
   * @returns Number of bytes
   */
  convertUnitToNum = (unitStr: string): number => {
    unitStr = this.normalizeUnit(unitStr);
    if (!unitStr) {
      return 1;
    }
    return (1024 ** (this.iecUnits.indexOf(unitStr)));
  };

  stringAsUrlParsing = (value: string): string => {
    if (value.startsWith('http')) {
      return value;
    }

    return `${this.protocol}//${value}`;
  };
}
