import { createDirectiveFactory, SpectatorDirective } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import {
  WithLoadingStateErrorComponent,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state-error/with-loading-state-error.component';
import {
  WithLoadingStateLoaderComponent,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state-loader/with-loading-state-loader.component';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';

describe('WithLoadingStateDirective', () => {
  let spectator: SpectatorDirective<WithLoadingStateDirective>;
  const createDirective = createDirectiveFactory({
    directive: WithLoadingStateDirective,
    declarations: [
      WithLoadingStateLoaderComponent,
      WithLoadingStateErrorComponent,
    ],
  });

  it('shows a loading skeleton isLoading in loading state is true', () => {
    spectator = createDirective('<div *ixWithLoadingState="value$">Not shown</div>', {
      hostProps: {
        value$: of({ isLoading: true, value: 'test', error: new Error() }),
      },
    });

    expect(spectator.fixture.nativeElement).not.toHaveText('Not shown');
    expect(spectator.query(WithLoadingStateLoaderComponent)).toExist();
  });

  it('shows error when error is not empty', () => {
    spectator = createDirective('<div *ixWithLoadingState="value$">Not shown</div>', {
      hostProps: {
        value$: of({ isLoading: false, value: 'test', error: new Error() }),
      },
    });

    expect(spectator.fixture.nativeElement).not.toHaveText('Not shown');
    expect(spectator.fixture.nativeElement).toHaveText('Error');
    expect(spectator.query(WithLoadingStateLoaderComponent)).not.toExist();
  });

  it('shows content when isLoading is false and error is not empty', () => {
    spectator = createDirective('<div *ixWithLoadingState="value$ as value">{{ value }}</div>', {
      hostProps: {
        value$: of({ isLoading: false, value: 'test', error: undefined }),
      },
    });

    expect(spectator.fixture.nativeElement).toHaveText('test');
    expect(spectator.fixture.nativeElement).not.toHaveText('Error');
    expect(spectator.query(WithLoadingStateLoaderComponent)).not.toExist();
  });
});
