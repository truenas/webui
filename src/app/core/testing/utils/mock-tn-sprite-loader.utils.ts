import { mockProvider } from '@ngneat/spectator/jest';
import { TnSpriteLoaderService } from '@truenas/ui-components';

export function mockTnSpriteLoader(): ReturnType<typeof mockProvider<TnSpriteLoaderService>> {
  return mockProvider(TnSpriteLoaderService, {
    ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
    getIconUrl: jest.fn(),
    getSafeIconUrl: jest.fn(),
    isSpriteLoaded: jest.fn(() => true),
    getSpriteConfig: jest.fn(),
  });
}
