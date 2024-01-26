import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { FileSizeBase2Pipe } from 'app/core/pipes/file-size-base-2.pipe';

describe('BitSizePipe', () => {
  let spectator: SpectatorPipe<FileSizeBase2Pipe>;
  const inputValue = 1024;
  const createPipe = createPipeFactory({
    pipe: FileSizeBase2Pipe,
  });

  beforeEach(() => {
    spectator = createPipe('{{ inputValue | bits }}', {
      hostProps: {
        inputValue,
      },
    });
  });

  it('converts bits to proper unit', () => {
    expect(spectator.element.innerHTML).toBe('1.2 kbit');
  });
});
