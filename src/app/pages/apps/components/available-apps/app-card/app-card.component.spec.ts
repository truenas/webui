import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';

describe('AppCardComponent', () => {
  let spectator: Spectator<AppCardComponent>;
  const createComponent = createComponentFactory({
    component: AppCardComponent,
    imports: [

    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: {
          name: 'SETI@home',
          icon_url: 'https://www.seti.org/logo.png',
          app_readme: 'Use your computer to help SETI@home search for extraterrestrial intelligence.',
          latest_version: '1.0.0',
          catalog: {
            id: 'official',
            train: 'charts',
            label: 'Official',
          },
        } as CatalogApp,
      },
    });
  });

  it('shows app name', () => {
    expect(spectator.query('.name')).toHaveExactText('SETI@home');
  });

  it('shows app logo', () => {
    expect(spectator.query('.logo')).toHaveAttribute('src', 'https://www.seti.org/logo.png');
  });

  it('shows installed badge when [installed] is true', () => {
    spectator.setInput({ installed: true });
    expect(spectator.query('.installed-badge')).toExist();
  });

  it('shows app description', () => {
    const description = spectator.query('.description');
    expect(description).toHaveExactText('Use your computer to help SETI@home search for extraterrestrial intelligence.');
  });

  it('shows catalog name', () => {
    expect(spectator.query('.catalog')).toHaveText('Official');
  });

  it('shows train name', () => {
    expect(spectator.query('.train')).toHaveExactText('Train: charts');
  });

  it('shows app version', () => {
    expect(spectator.query('.version')).toHaveExactText('v1.0.0');
  });

  // TODO: Missing backend support.
  it.skip('shows last update date of an app', () => {
    expect(spectator.query('.updated')).toHaveExactText('08/08/2023');
  });
});
