import {
  KiB, MiB, GiB, TiB,
} from 'app/constants/bytes.constant';
import { ReportingGraphName } from 'app/enums/reporting.enum';
import { ReportingData } from 'app/interfaces/reporting.interface';
import {
  formatValue, maxDecimals, inferUnits, convertKmgt, convertByKilobits,
  convertByThousands, formatData, convertAggregations, optimizeLegend,
} from 'app/pages/reports-dashboard/utils/report.utils';

describe('optimizeLegend', () => {
  it('removes "time" from legend', () => {
    const data = {
      name: 'TestGraph',
      legend: ['time', 'value1', 'value2'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = optimizeLegend(data);
    expect(result.legend).toEqual(['value1', 'value2']);
  });

  it('applies specific replacements based on graph name', () => {
    const data = {
      name: 'memory',
      legend: ['memory-used_value', 'memory-free_value'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = optimizeLegend(data);
    expect(result.legend).toEqual(['Used', 'Free']);
  });

  it('handles graph names not in replacements map', () => {
    const data = {
      name: 'UnknownGraph',
      legend: ['value1', 'value2'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = optimizeLegend(data);
    expect(result.legend).toEqual(['value1', 'value2']);
  });

  it('replaces legend labels for "diskgeomlatency"', () => {
    const data = {
      name: 'diskgeomlatency',
      legend: ['geom_latency-read_time', 'geom_latency-write_time'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = optimizeLegend(data);
    expect(result.legend).toEqual(['Read Time', 'Write Time']);
  });

  it('replaces legend labels for "diskgeombusy"', () => {
    const data = {
      name: 'diskgeombusy',
      legend: ['some_label'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = optimizeLegend(data);
    expect(result.legend).toEqual(['Busy']);
  });
});

describe('convertAggregations', () => {
  it('formats aggregations with inferred units and suffix', () => {
    const data = {
      name: 'TestGraph',
      legend: ['time', 'value'],
      data: [],
      aggregations: { min: [1024], max: [2048], mean: [1536] },
    } as ReportingData;

    const result = convertAggregations(data, 'Data Transfer (bytes)/s');

    expect(result.aggregations.min).toEqual(['1 KiB/s']);
    expect(result.aggregations.max).toEqual(['2 KiB/s']);
    expect(result.aggregations.mean).toEqual(['1.5 KiB/s']);
  });

  it('returns data unchanged if units cannot be inferred', () => {
    console.warn = jest.fn();
    const data = {
      name: 'TestGraph',
      legend: ['time', 'value'],
      data: [],
      aggregations: {},
    } as ReportingData;

    const result = convertAggregations(data, 'Unknown Unit');

    expect(result).toEqual(data);
    expect(console.warn).toHaveBeenCalledWith('Could not infer units from Unknown Unit');
  });

  it('handles aggregations with object values', () => {
    const data: ReportingData = {
      name: 'TestGraph',
      legend: ['time', 'value'],
      data: [],
      aggregations: {
        min: [1024],
        max: [2048],
        mean: [1536],
      },
    } as ReportingData;

    const result = convertAggregations(data, 'Data Transfer (bytes)/s');

    expect(result.aggregations.min).toEqual(['1 KiB/s']);
    expect(result.aggregations.max).toEqual(['2 KiB/s']);
    expect(result.aggregations.mean).toEqual(['1.5 KiB/s']);
  });
});

describe('formatData', () => {
  it('removes "min" aggregation for NetworkInterface graphs', () => {
    const data = {
      name: ReportingGraphName.NetworkInterface,
      legend: ['time', 'eth0'],
      data: [[1, 100]],
      aggregations: { min: [0], max: [100], mean: [50] },
    } as ReportingData;

    const result = formatData(data);
    expect(result.aggregations.min).toBeUndefined();
    expect(result.aggregations.max).toEqual([100]);
    expect(result.aggregations.mean).toEqual([50]);
  });

  it('reverses legend and data for CPU graphs', () => {
    const data = {
      name: ReportingGraphName.Cpu,
      legend: ['time', 'user', 'system'],
      data: [
        [1, 20, 30],
        [2, 25, 35],
      ],
      aggregations: { min: [10, 15], max: [50, 55], mean: [30, 35] },
    } as ReportingData;

    const result = formatData(data);
    expect(result.legend).toEqual(['system', 'user', 'time']);
    expect(result.data).toEqual([
      [1, 30, 20],
      [2, 35, 25],
    ]);
    expect(result.aggregations.min).toEqual([15, 10]);
    expect(result.aggregations.max).toEqual([55, 50]);
    expect(result.aggregations.mean).toEqual([35, 30]);
  });

  it('returns data unchanged for other graph names', () => {
    const data = {
      name: 'OtherGraph',
      legend: ['time', 'value'],
      data: [[1, 100]],
      aggregations: { min: [0], max: [100], mean: [50] },
    } as ReportingData;

    const result = formatData(data);
    expect(result).toEqual(data);
  });
});

describe('convertByThousands', () => {
  it('converts input to "m" when input >= 1,000,000', () => {
    expect(convertByThousands(2_000_000)).toEqual({ value: 2, suffix: 'm' });
    expect(convertByThousands(1_500_000)).toEqual({ value: 1.5, suffix: 'm' });
  });

  it('converts input to "k" when input >= 1,000 and < 1,000,000', () => {
    expect(convertByThousands(500_000)).toEqual({ value: 500, suffix: 'k' });
    expect(convertByThousands(1_000)).toEqual({ value: 1, suffix: 'k' });
  });

  it('keeps input as is when input < 1,000', () => {
    expect(convertByThousands(500)).toEqual({ value: 500, suffix: '' });
  });

  it('handles zero and negative inputs', () => {
    expect(convertByThousands(0)).toEqual({ value: 0, suffix: '' });
    expect(convertByThousands(-1_000)).toEqual({ value: -1_000, suffix: '' });
  });
});

describe('convertByKilobits', () => {
  it('converts input to Mb when input >= 1,000,000', () => {
    expect(convertByKilobits(2_000_000)).toEqual({ value: 2, suffix: 'Mb' });
    expect(convertByKilobits(1_500_000)).toEqual({ value: 1.5, suffix: 'Mb' });
  });

  it('converts input to kb when input >= 1,000 and < 1,000,000', () => {
    expect(convertByKilobits(500_000)).toEqual({ value: 500, suffix: 'kb' });
    expect(convertByKilobits(1_000)).toEqual({ value: 1, suffix: 'kb' });
  });

  it('keeps input in bits when input < 1,000', () => {
    expect(convertByKilobits(500)).toEqual({ value: 500, suffix: 'b' });
  });

  it('handles zero and negative inputs', () => {
    expect(convertByKilobits(0)).toEqual({ value: 0, suffix: 'b' });
    expect(convertByKilobits(-1_000)).toEqual({ value: -1_000, suffix: 'b' });
  });
});

describe('convertKmgt', () => {
  it('converts input to TiB when input >= TiB', () => {
    expect(convertKmgt(2 * TiB, 'bytes')).toEqual({ value: 2, prefix: 'Tebi', shortName: 'TiB' });
  });

  it('converts input to GiB when input >= GiB and < TiB', () => {
    expect(convertKmgt(500 * GiB, 'bytes')).toEqual({ value: 500, prefix: 'Gibi', shortName: 'GiB' });
  });

  it('converts input to MiB when input >= MiB and < GiB', () => {
    expect(convertKmgt(500 * MiB, 'bytes')).toEqual({ value: 500, prefix: 'Mebi', shortName: 'MiB' });
  });

  it('converts input to KiB when input >= KiB and < MiB', () => {
    expect(convertKmgt(500 * KiB, 'bytes')).toEqual({ value: 500, prefix: 'Kibi', shortName: 'KiB' });
  });

  it('returns input in bytes when input < KiB', () => {
    expect(convertKmgt(500, 'bytes')).toEqual({ value: 500, prefix: '', shortName: 'B' });
  });

  it('removes "i" from shortName when units are "bits"', () => {
    expect(convertKmgt(2 * GiB, 'bits')).toEqual({ value: 2, prefix: 'Gibi', shortName: 'GB' });
  });

  it('handles unknown units by returning input value with "B" as shortName', () => {
    expect(convertKmgt(500, 'unknown')).toEqual({ value: 500, prefix: '', shortName: 'B' });
  });
});

describe('inferUnits', () => {
  it('infers "%" from labels containing "%" or "percentage"', () => {
    expect(inferUnits('CPU Usage (%)')).toBe('%');
    expect(inferUnits('Disk Usage Percentage')).toBe('%');
  });

  it('infers "°" from labels containing "°" or "celsius"', () => {
    expect(inferUnits('Temperature (°C)')).toBe('°');
    expect(inferUnits('CPU Celsius')).toBe('°');
  });

  it('infers "mebibytes" from labels containing "mebibytes"', () => {
    expect(inferUnits('Memory Usage in Mebibytes')).toBe('mebibytes');
  });

  it('infers "kibibytes" from labels containing "kibibytes"', () => {
    expect(inferUnits('Disk Cache Kibibytes')).toBe('kibibytes');
  });

  it('infers "kilobits" from labels containing "kilobits"', () => {
    expect(inferUnits('Network Speed in Kilobits')).toBe('kilobits');
  });

  it('infers "bytes" from labels containing "bytes"', () => {
    expect(inferUnits('Data Transfer (bytes)')).toBe('bytes');
  });

  it('infers "bits" from labels containing "bits"', () => {
    expect(inferUnits('Signal Strength in bits')).toBe('bits');
  });

  it('returns undefined and logs a warning for unknown units', () => {
    console.warn = jest.fn();
    expect(inferUnits('Unknown Unit')).toBe('Unknown Unit');
    expect(console.warn).toHaveBeenCalledWith('Could not infer units from Unknown Unit');
  });
});

describe('maxDecimals', () => {
  it('limits decimals when input is less than 1000', () => {
    expect(maxDecimals(123.4567)).toBe(123);
    expect(maxDecimals(5.2)).toBe(5.2);
    expect(maxDecimals(33.262)).toBe(33.2);
    expect(maxDecimals(999.9999)).toBe(1000);
  });

  it('rounds to nearest integer when input is 1000 or more', () => {
    expect(maxDecimals(1000.1234)).toBe(1000);
    expect(maxDecimals(1500.9876)).toBe(1501);
  });

  it('handles negative numbers correctly', () => {
    expect(maxDecimals(-123.4567)).toBe(-123);
  });

  it('handles zero correctly', () => {
    expect(maxDecimals(0)).toBe(0);
  });
});

describe('formatValue', () => {
  it('returns default value', () => {
    expect(formatValue(500000000, 'test_unknown')).toBe('500m');
  });

  it('returns value for Seconds', () => {
    expect(formatValue(60 * 60 * 24 * 3, 'Seconds')).toBe('3 days');
  });

  it('returns value for Mebibytes', () => {
    expect(formatValue(500, 'Mebibytes')).toBe('500 MiB');
  });

  it('returns value for Kibibytes', () => {
    expect(formatValue(500, 'Kibibytes')).toBe('500 KiB');
  });

  it('returns value for Kilobits', () => {
    expect(formatValue(500, 'Kilobits')).toBe('500 kb');
  });

  it('returns value for bits', () => {
    expect(formatValue(500, 'bits')).toBe('500 B');
  });

  it('returns value for bytes', () => {
    expect(formatValue(500, 'bytes')).toBe('500 B');
  });
});
