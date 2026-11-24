import { toUnlockArgs } from 'app/interfaces/dataset-lock.interface';

describe('toUnlockArgs', () => {
  it('translates the unlock form request into zfs.resource.encryption.unlock', () => {
    expect(toUnlockArgs('dozer/enc', {
      recursive: true,
      force: false,
      key_file: false,
      toggle_attachments: true,
      datasets: [
        { name: 'dozer/enc', passphrase: 'testtest1' },
        { name: 'dozer/enc/key', key: 'abc' },
      ],
    })).toEqual({
      path: 'dozer/enc',
      recursive: true,
      force: false,
      key_file: false,
      start_attachments: true,
      keys: [
        { path: 'dozer/enc', passphrase: 'testtest1', key: undefined },
        { path: 'dozer/enc/key', key: 'abc', passphrase: undefined },
      ],
    });
  });

  it('leaves out what was not given', () => {
    expect(toUnlockArgs('dozer/enc', { key_file: true })).toEqual({ path: 'dozer/enc', key_file: true });
  });
});
