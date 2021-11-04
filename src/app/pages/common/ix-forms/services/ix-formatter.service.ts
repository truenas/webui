export class IxFormatter {
  static humanReadable: string;
  static readonly IECUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

  static readonly memorySizeFormatting: (val: string | number) => string = (value: string | number) => {
    value = value.toString();
    if (!value) {
      return '';
    }
    let formatted = '';
    const memoryInNumbers = IxFormatter.convertHumanStringToNum(value);
    if (Number.isNaN(memoryInNumbers)) {
      console.error(memoryInNumbers);
    } else if (value.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      formatted = IxFormatter.convertBytestoHumanReadable(value.replace(/\s/g, ''), 0);
    } else {
      formatted = IxFormatter.humanReadable;
    }
    return formatted;
  };

  static readonly memorySizeParsing: (val: string) => number = (value: string) => {
    value = value.toString();
    if (!value) {
      return NaN;
    }
    let humanStringToNum = IxFormatter.convertHumanStringToNum(value);
    if (humanStringToNum === Number(value)) {
      value += 'mb';
      humanStringToNum = IxFormatter.convertHumanStringToNum(value);
    }
    return humanStringToNum;
  };

  // Converts a number from bytes to the most natural human readable format
  static readonly convertBytestoHumanReadable = (
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
      units = IxFormatter.IECUnits[i];
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
  // '512x'      ''               NaN
  // '0'         '0'              0
  // '0b'        ''               NaN
  // '',         '0'              0
  // '4MB',      '4 MiB'          4*1024**2 (4,194,304)
  // '16KiB'     '16 KiB'         16*1024   (16,384)
  // 'g'         ''               NaN
  // ' t1'       ''               NaN
  // '   5   m'  '5 MiB'          5*1024**2 (5,242,880)
  // '1m',       '1 MiB'          1024**2   (1,048,576)
  // '    T'     ''               NaN
  // '2 MiB  '   '2 MiB'          2*1024**2 (2,097,152)
  // '2 MiB x8'  ''               NaN
  // '256 k'     '256 KiB'        256*1024  (262,144)
  // 'm4m k'     ''               NaN
  // '4m k'      ''               NaN
  // '1.2m'      ''               NaN
  // '12k4'      ''               NaN
  // '12.4k'     ''               NaN
  // ' 10G'      '10 GiB'         10*1024**3 (10,737,418,240)

  // hstr = the human string from the form;
  // dec = allow decimals;
  // allowedUnits (optional) should include any or all of 'kmgtp', the first letters of KiB, Mib, etc. The first letter
  // is used as the default, so for 'gtp', an entered value of 256 becomes 256 GiB. If you don't pass in allowedUnits,
  // all of the above are accepted AND no unit is attached to an unlabeled number, so 256 is considered 256 bytes.
  static readonly convertHumanStringToNum = (hstr: string, dec = false, allowedUnits?: string): number => {
    let num = '0';
    let unit = '';

    // empty value is evaluated as zero
    if (!hstr) {
      IxFormatter.humanReadable = '0';
      return 0;
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
      IxFormatter.humanReadable = '';
      return NaN;
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
          || !(unit = IxFormatter.normalizeUnit(unit)))) {
      IxFormatter.humanReadable = '';
      return NaN;
    }

    const spacer = (unit) ? ' ' : '';

    IxFormatter.humanReadable = num.toString() + spacer + unit;
    return Number(num) * IxFormatter.convertUnitToNum(unit);
  };

  static readonly normalizeUnit = (unitStr: string): string => {
    // normalize short units ("MB") or human units ("M") to IEC units ("MiB")
    // unknown values return undefined

    // empty unit is valid, just return
    if (!unitStr) {
      return '';
    }

    const IECUnitsStr = IxFormatter.IECUnits.join('|');
    const shortUnitsStr = IxFormatter.IECUnits.map((unit) => {
      if (unit.length > 1) {
        return unit.charAt(0) + unit.charAt(2);
      }
      return 'BYTES';
    }).join('|');
    const humanUnitsStr = IxFormatter.IECUnits.map((unit) => unit.charAt(0)).join('|');

    const allUnitsStr = (IECUnitsStr + '|' + shortUnitsStr + '|' + humanUnitsStr).toUpperCase();
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

  static readonly convertUnitToNum = (unitStr: string): number => {
    // convert IEC ("MiB"), short ("MB"), or human ("M") units to numbers
    // unknown units are evaluated as 1

    unitStr = IxFormatter.normalizeUnit(unitStr);
    if (!unitStr) {
      return 1;
    }
    return (1024 ** (IxFormatter.IECUnits.indexOf(unitStr)));
  };
}
