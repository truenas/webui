import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { IxFileSizePipe } from 'app/modules/ix-file-size/ix-file-size.pipe';

let spectator: SpectatorPipe<IxFileSizePipe>;
const createPipe = createPipeFactory({
  pipe: IxFileSizePipe,
});
describe('It converts 1024 bits to 1.02 kb with base 10', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'b\', base: 10 } }}', {
      hostProps: {
        inputValue: 1024,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('1.02 kb');
  });
});

describe('It converts 1024 bits to 1 Kib with base 2', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'b\', base: 2 } }}', {
      hostProps: {
        inputValue: 1024,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('1 Kib');
  });
});

describe('It converts 1024 bits to 1 KiB with base 2', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'B\', base: 2 } }}', {
      hostProps: {
        inputValue: 1024,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('1 KiB');
  });
});

describe('It converts 1000 bits to 1 kB with base 10', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'B\', base: 10 } }}', {
      hostProps: {
        inputValue: 1000,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('1 kB');
  });
});

describe('It converts 1000 bits to 1 kb with base 10', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'b\', base: 10 } }}', {
      hostProps: {
        inputValue: 1000,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('1 kb');
  });
});

describe('It converts random bits', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'b\', base: 10 } }}', {
      hostProps: {
        inputValue: 123456789,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('123.46 Mb');
  });
});

describe('It converts random bytes', () => {
  beforeEach(() => {
    spectator = createPipe('{{ inputValue | ixFileSize: { baseUnit: \'B\', base: 2 } }}', {
      hostProps: {
        inputValue: 123456789,
      },
    });
  });

  it('converts bits to kb', () => {
    expect(spectator.element.innerHTML).toBe('117.74 MiB');
  });
});
