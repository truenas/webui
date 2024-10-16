import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent, NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AppJsonDetailsCardComponent } from './app-json-details-card.component';

interface JsonDetails { key: string; value: string }

describe('AppJsonDetailsCardComponent', () => {
  let spectator: Spectator<AppJsonDetailsCardComponent<JsonDetails>>;

  const jsonDetails = [
    { key: 'description', value: 'AdGuard Home is able to bind to a privileged port.' },
    { key: 'name', value: 'NET_BIND_SERVICE' },
  ];

  const createComponent = createComponentFactory({
    component: AppJsonDetailsCardComponent<JsonDetails>,
    imports: [NgxSkeletonLoaderModule],
    declarations: [
      MockComponents(
        NgxSkeletonLoaderComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        jsonDetails,
        title: 'Capabilities',
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('h3')).toHaveText('Capabilities');
  });

  it('renders JSON details when not loading', () => {
    spectator.setInput('isLoading', false);

    const items = spectator.queryAll('.app-list-item');

    expect(items).toHaveLength(4);

    expect(items[0].querySelector('.label')).toHaveText('Key:');
    expect(items[0].querySelector('div')).toHaveText('description');

    expect(items[1].querySelector('.label')).toHaveText('Value:');
    expect(items[1].querySelector('div')).toHaveText('AdGuard Home is able to bind to a privileged port.');

    expect(items[2].querySelector('.label')).toHaveText('Key:');
    expect(items[2].querySelector('div')).toHaveText('name');

    expect(items[3].querySelector('.label')).toHaveText('Value:');
    expect(items[3].querySelector('div')).toHaveText('NET_BIND_SERVICE');
  });

  it('displays skeleton loader when loading', () => {
    spectator.setInput('isLoading', true);

    expect(spectator.query('ngx-skeleton-loader')).toBeTruthy();
    expect(spectator.query('.app-list-item')).toBeTruthy();
  });

  it('hides skeleton loader when not loading', () => {
    spectator.setInput('isLoading', false);

    expect(spectator.query('ngx-skeleton-loader')).toBeFalsy();
    expect(spectator.query('.app-list-item')).toBeTruthy();
  });
});
