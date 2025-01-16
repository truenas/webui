import { createHostFactory } from '@ngneat/spectator/jest';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';

describe('HasAccessDirective', () => {
  const createDirective = createHostFactory({
    component: HasAccessDirective,
  });

  it('shows element when hasAccess is true', () => {
    const spectator = createDirective(`
      <div id="test" *ixHasAccess="true"></div>
    `);

    const element = spectator.fixture.nativeElement as HTMLElement;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild).toHaveId('test');
    expect(element.firstElementChild!.tagName).toBe('DIV');
  });

  it('adds missing access wrapper over the element when hasAccess is false', () => {
    const spectator = createDirective(`
      <div id="test" *ixHasAccess="false"></div>
    `);

    const element = spectator.fixture.nativeElement as HTMLElement;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild!.tagName).toBe('ix-missing-access-wrapper'.toUpperCase());
  });
});
