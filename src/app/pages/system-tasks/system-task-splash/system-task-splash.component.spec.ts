import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ProductType } from 'app/enums/product-type.enum';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { SystemTaskSplashComponent } from 'app/pages/system-tasks/system-task-splash/system-task-splash.component';
import { selectIsEnterprise, selectProductType } from 'app/store/system-info/system-info.selectors';

describe('SystemTaskSplashComponent', () => {
  let spectator: Spectator<SystemTaskSplashComponent>;
  const createComponent = createComponentFactory({
    component: SystemTaskSplashComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectProductType, value: ProductType.CommunityEdition },
          { selector: selectIsEnterprise, value: false },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { message: ignoreTranslation('System is restarting...') } });
  });

  // Rendered DOM instead of a harness: there is no TnCardHarness in @truenas/ui-components.
  it('shows the message as a heading inside the card, along with the logo', () => {
    expect(spectator.query('tn-card h1.message')).toHaveText('System is restarting...');
    expect(spectator.query('tn-card tn-icon.logo')).toExist();
    expect(spectator.query('ix-copyright-line')).toExist();
  });

  // The heading is the only live region, so the logo and copyright line are not announced
  // along with the message.
  it('announces the message, and nothing else, as a live region', () => {
    expect(spectator.queryAll('[aria-live]')).toHaveLength(1);
    expect(spectator.query('h1.message')).toHaveAttribute('aria-live', 'polite');
  });
});
