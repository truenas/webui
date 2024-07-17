import { createDirectiveFactory } from '@ngneat/spectator/jest';
import { AutofocusDirective } from 'app/directives/autofocus/autofocus.directive';

describe('AutofocusDirective', () => {
  const createDirective = createDirectiveFactory({
    directive: AutofocusDirective,
  });

  const onFocus = jest.fn();

  beforeEach(() => {
    createDirective(`
      <div ixAutofocus>
        <input type="text" (focus)="onFocus()" />
      </div>
    `, {
      hostProps: {
        onFocus,
      },
    });
  });

  it('focuses on nested input when directive is initialized', () => {
    expect(onFocus).toHaveBeenCalled();
  });
});
