import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { UserAvatarPipe } from 'app/pages/audit/utils/user-avatar.pipe';

describe('UserAvatarPipe', () => {
  let spectator: SpectatorPipe<UserAvatarPipe>;
  const createPipe = createPipeFactory({
    pipe: UserAvatarPipe,
  });

  it('transforms username to SVG avatar', () => {
    spectator = createPipe('{{ "testuser" | userAvatar }}');

    expect(spectator.element.innerHTML).toContain('svg');
  });
});
