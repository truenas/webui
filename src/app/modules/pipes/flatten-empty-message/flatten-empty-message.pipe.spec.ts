import { snapshotTaskEmptyConfig } from 'app/constants/empty-configs';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';

describe('FlattenEmptyMessagePipe', () => {
  const pipe = new FlattenEmptyMessagePipe();

  it('flattens the <p>-wrapped snapshot-task message to the single line tn-empty renders', () => {
    expect(pipe.transform(snapshotTaskEmptyConfig.message)).toBe(
      'Automatically create point-in-time snapshots of selected datasets at regular intervals.'
      + ' These snapshots help preserve data states for recovery, backup, and versioning purposes,'
      + ' ensuring minimal data loss in case of accidental deletion or corruption.',
    );
  });

  it('flattens <br> markup and collapses the surrounding whitespace', () => {
    expect(pipe.transform('First line. <br>\nSecond line.')).toBe('First line. Second line.');
  });

  it('leaves a plain message untouched', () => {
    expect(pipe.transform('Nothing to strip here.')).toBe('Nothing to strip here.');
  });

  it('returns an empty string for a config with no message', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
