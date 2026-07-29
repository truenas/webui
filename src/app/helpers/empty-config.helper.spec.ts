import { snapshotTaskEmptyConfig } from 'app/constants/empty-configs';
import { flattenEmptyConfigMessage } from 'app/helpers/empty-config.helper';

describe('flattenEmptyConfigMessage', () => {
  it('flattens the <p>-wrapped snapshot-task message to the single line tn-empty renders', () => {
    expect(flattenEmptyConfigMessage(snapshotTaskEmptyConfig.message)).toBe(
      'Automatically create point-in-time snapshots of selected datasets at regular intervals.'
      + ' These snapshots help preserve data states for recovery, backup, and versioning purposes,'
      + ' ensuring minimal data loss in case of accidental deletion or corruption.',
    );
  });

  it('flattens <br> markup and collapses the surrounding whitespace', () => {
    expect(flattenEmptyConfigMessage('First line. <br>\nSecond line.')).toBe('First line. Second line.');
  });

  it('leaves a plain message untouched', () => {
    expect(flattenEmptyConfigMessage('Nothing to strip here.')).toBe('Nothing to strip here.');
  });
});
