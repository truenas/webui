import { Injectable } from '@angular/core';

@Injectable()
export class IxFormatterService {
  readonly IecUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  memorySizeFormatting: (val: string | number) => string = (value: string | number) => {
    value = value.toString();
    if (!value) {
      return '';
    }
    let formatted = '';
    if (value.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      formatted = this.convertBytestoHumanReadable(value.replace(/\s/g, ''), 0);
    } else {
      formatted = this.reformatHumanString(value);
    }
    return formatted;
  };

  memorySizeParsing: (val: string) => number = (value: string) => {
    value = value.toString();
    if (!value) {
      return null;
    }
    let humanStringToNum = this.convertHumanStringToNum(value);
    if (humanStringToNum === Number(value)) {
      value += 'mb';
      humanStringToNum = this.convertHumanStringToNum(value);
    }
    return humanStringToNum;
  };

  // Converts a number from bytes to the most natural human readable format
  convertBytestoHumanReadable = (
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
      units = this.IecUnits[i];
    } else if (minUnits) {
      units = minUnits;
    } else {
      units = hideBytes ? '' : 'B';
    }
    return `${bytes.toFixed(dec)} ${units}`;
  };

  // sample data, input and return values
  // input       normalized       number value
  // '12345'     '12345'          12345
  // '512x'      ''               null
  // '0'         '0'              0
  // '0b'        ''               null
  // '',         '0'              0
  // '4MB',      '4 MiB'          4*1024**2 (4,194,304)
  // '16KiB'     '16 KiB'         16*1024   (16,384)
  // 'g'         ''               null
  // ' t1'       ''               null
  // '   5   m'  '5 MiB'          5*1024**2 (5,242,880)
  // '1m',       '1 MiB'          1024**2   (1,048,576)
  // '    T'     ''               null
  // '2 MiB  '   '2 MiB'          2*1024**2 (2,097,152)
  // '2 MiB x8'  ''               null
  // '256 k'     '256 KiB'        256*1024  (262,144)
  // 'm4m k'     ''               null
  // '4m k'      ''               null
  // '1.2m'      ''               null
  // '12k4'      ''               null
  // '12.4k'     ''               null
  // ' 10G'      '10 GiB'         10*1024**3 (10,737,418,240)

  // hstr = the human string from the form;
  // dec = allow decimals;
  // allowedUnits (optional) should include any or all of 'kmgtp', the first letters of KiB, Mib, etc. The first letter
  // is used as the default, so for 'gtp', an entered value of 256 becomes 256 GiB. If you don't pass in allowedUnits,
  // all of the above are accepted AND no unit is attached to an unlabeled number, so 256 is considered 256 bytes.
  convertHumanStringToNum = (hstr: string, dec = false, allowedUnits?: string): number => {
    let num = '0';
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
      return null;
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
      return null;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if (!unit && allowedUnits) {
      unit = allowedUnits[0];
    }

    // error when unit is present and...
    if ((unit)
          // ...allowedUnits are passed in but unit is not in allowed Units
          && (allowedUnits && !allowedUnits.toLowerCase().includes(unit[0].toLowerCase())
          // ...when allowedUnits are not passed in and unit is not recognized
          || !(unit = this.normalizeUnit(unit)))) {
      return null;
    }

    return Number(num) * this.convertUnitToNum(unit);
  };

  reformatHumanString = (hstr: string, dec = false, allowedUnits?: string): string => {
    let num = '0';
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
      return null as string;
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
      return null as string;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if (!unit && allowedUnits) {
      unit = allowedUnits[0];
    }

    // error when unit is present and...
    if ((unit)
          // ...allowedUnits are passed in but unit is not in allowed Units
          && (allowedUnits && !allowedUnits.toLowerCase().includes(unit[0].toLowerCase())
          // ...when allowedUnits are not passed in and unit is not recognized
          || !(unit = this.normalizeUnit(unit)))) {
      return null as string;
    }

    const spacer = (unit) ? ' ' : '';

    return num.toString() + spacer + unit;
  };

  normalizeUnit = (unitStr: string): string => {
    // normalize short units ("MB") or human units ("M") to IEC units ("MiB")
    // unknown values return undefined

    // empty unit is valid, just return
    if (!unitStr) {
      return '';
    }

    const IecUnitsStr = this.IecUnits.join('|');
    const shortUnitsStr = this.IecUnits.map((unit) => {
      if (unit.length > 1) {
        return unit.charAt(0) + unit.charAt(2);
      }
      return 'BYTES';
    }).join('|');
    const humanUnitsStr = this.IecUnits.map((unit) => unit.charAt(0)).join('|');

    const allUnitsStr = (IecUnitsStr + '|' + shortUnitsStr + '|' + humanUnitsStr).toUpperCase();
    const unitsRE = new RegExp('^\\s*(' + allUnitsStr + '){1}\\s*$');

    unitStr = unitStr.toUpperCase();
    if (unitStr.match(unitsRE)) {
      // always return IEC units
      // could take a parameter to return short or human units
      if (unitStr.toLowerCase() === 'b' || unitStr.toLowerCase() === 'bytes') {
        return 'B';
      }
      return unitStr.charAt(0).toUpperCase() + 'iB';
    }
    return undefined;
  };

  convertUnitToNum = (unitStr: string): number => {
    // convert IEC ("MiB"), short ("MB"), or human ("M") units to numbers
    // unknown units are evaluated as 1

    unitStr = this.normalizeUnit(unitStr);
    if (!unitStr) {
      return 1;
    }
    return (1024 ** (this.IecUnits.indexOf(unitStr)));
  };
}
