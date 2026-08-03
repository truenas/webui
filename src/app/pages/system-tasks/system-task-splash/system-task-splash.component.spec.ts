import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { ProductType } from 'app/enums/product-type.enum';
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
    spectator = createComponent({ props: { message: 'System is restarting...' } });
  });

  // Rendered DOM instead of a harness: there is no TnCardHarness in @truenas/ui-components.
  it('shows the message as a heading inside the card, along with the logo', () => {
    expect(spectator.query('tn-card h1.message')).toHaveText('System is restarting...');
    expect(spectator.query('tn-card tn-icon.logo')).toExist();
    expect(spectator.query('ix-copyright-line')).toExist();
  });

  // Scoped to the heading so the logo and copyright line are not announced with the message.
  it('announces the message as a status region', () => {
    expect(spectator.query('h1.message')).toHaveAttribute('role', 'status');
    expect(spectator.query('.wrapper')).not.toHaveAttribute('role', 'status');
  });
});
