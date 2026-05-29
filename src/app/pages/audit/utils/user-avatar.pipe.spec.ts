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

  it('does not interpolate the username into the resulting markup', () => {
    // Regression guard for the sanitizer bypass in UserAvatarPipe — if a future
    // jdenticon version (or replacement) ever embeds the input into the SVG,
    // this test fails and forces a re-review of the bypass.
    spectator = createPipe('{{ username | userAvatar }}', {
      hostProps: { username: '<script>alert("xss")</script>' },
    });

    expect(spectator.element.innerHTML).not.toContain('<script');
    expect(spectator.element.innerHTML).not.toContain('alert("xss")');
  });
});
