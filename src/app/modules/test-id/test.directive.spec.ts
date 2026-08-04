import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator/jest';
import { TestDirective } from 'app/modules/test-id/test.directive';

describe('TestDirective', () => {
  const createDirective = createDirectiveFactory({
    directive: TestDirective,
  });

  function testAttributeOf(template: string): string | null {
    const spectator: SpectatorDirective<TestDirective> = createDirective(template);
    return spectator.element.getAttribute('data-test');
  }

  it('prefixes the id with the element type', () => {
    expect(testAttributeOf('<button ixTest="resetSettings"></button>')).toBe('button-reset-settings');
  });

  it('kebab-cases every segment of an array separately', () => {
    expect(testAttributeOf('<input [ixTest]="[\'lagPorts\', \'eth0\']">')).toBe('input-lag-ports-eth-0');
  });

  // Legacy parity, deliberately not shared with `normalizeTestIdParts`: the directive's
  // filter is falsy-based, so a numeric 0 disappears rather than becoming `-0-`. Pinned
  // here so it is not "fixed" later — changing it would shift every existing id built
  // from a zero-valued segment.
  it('drops falsy segments, including a numeric 0', () => {
    expect(testAttributeOf('<input [ixTest]="[\'port\', 0, null, undefined, \'\', \'edit\']">'))
      .toBe('input-port-edit');
  });
});
