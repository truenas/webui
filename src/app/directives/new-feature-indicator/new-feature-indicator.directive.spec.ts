import { NgTemplateOutlet } from '@angular/common';
import { createHostFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NewFeatureIndicatorDirective } from 'app/directives/new-feature-indicator/new-feature-indicator.directive';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';

describe('NewFeatureIndicatorDirective', () => {
  const createDirective = createHostFactory({
    component: NewFeatureIndicatorDirective,
    imports: [
      NgTemplateOutlet,
    ],
    providers: [
      mockProvider(NewFeatureIndicatorService, {
        wasIndicatorShown: (indicator: NewFeatureIndicator) => {
          return ['test_key_2'].includes(indicator.key);
        },
        onShown: of(),
      }),
    ],
  });

  it('shows indicator wrapper when the message has not yet been shown', () => {
    const spectator = createDirective('<div id="test" *ixNewFeatureIndicator="indicator"></div>', {
      hostProps: {
        indicator: { key: 'test_key_1', message: 'test_message_1' },
      },
    });

    const element = spectator.fixture.nativeElement as HTMLElement;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild!.tagName).toBe('ix-new-feature-indicator-wrapper'.toUpperCase());
  });

  it('shows element when the message has already been shown', () => {
    const spectator = createDirective('<div id="test" *ixNewFeatureIndicator="indicator"></div>', {
      hostProps: {
        indicator: { key: 'test_key_2', message: 'test_message_2' },
      },
    });

    const element = spectator.fixture.nativeElement as HTMLElement;

    expect(element.children).toHaveLength(1);
    expect(element.firstElementChild!.tagName).toBe('div'.toUpperCase());
  });
});
