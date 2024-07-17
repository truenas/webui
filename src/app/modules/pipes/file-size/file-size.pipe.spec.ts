import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';

describe('FileSizePipe', () => {
  let spectator: SpectatorPipe<FileSizePipe>;
  const createPipe = createPipeFactory({
    pipe: FileSizePipe,
  });

  it('converts value to IEC units', () => {
    spectator = createPipe('{{ 1024 | ixFileSize }}');

    expect(spectator.element.innerHTML).toBe('1 KiB');
  });
});
