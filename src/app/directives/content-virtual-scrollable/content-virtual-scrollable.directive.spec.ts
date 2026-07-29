import { VIRTUAL_SCROLLABLE, CdkVirtualScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { ContentVirtualScrollableDirective } from 'app/directives/content-virtual-scrollable/content-virtual-scrollable.directive';

@Component({
  selector: 'ix-test-host',
  template: '<div ixContentVirtualScrollable class="host"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContentVirtualScrollableDirective],
})
class TestHostComponent {}

describe('ContentVirtualScrollableDirective', () => {
  let spectator: SpectatorHost<TestHostComponent>;
  let scrollElement: HTMLElement;

  const createHost = createHostFactory({
    component: TestHostComponent,
    imports: [ContentVirtualScrollableDirective],
  });

  const getProvidedScrollable = (): CdkVirtualScrollable => {
    return spectator.fixture.debugElement
      .query(By.css('.host'))
      .injector.get<CdkVirtualScrollable>(VIRTUAL_SCROLLABLE);
  };

  afterEach(() => {
    scrollElement?.remove();
  });

  it('provides VIRTUAL_SCROLLABLE targeting the app scroll container (.rightside-content-hold)', () => {
    scrollElement = document.createElement('div');
    scrollElement.className = 'rightside-content-hold';
    document.body.appendChild(scrollElement);

    spectator = createHost('<ix-test-host></ix-test-host>');

    const scrollable = getProvidedScrollable();
    expect(scrollable).toBeInstanceOf(ContentVirtualScrollableDirective);
    expect(scrollable.getElementRef().nativeElement).toBe(scrollElement);
  });

  it('falls back to its own host element when no app scroll container is present', () => {
    spectator = createHost('<ix-test-host></ix-test-host>');

    const scrollable = getProvidedScrollable();
    expect(scrollable.getElementRef().nativeElement).toBe(spectator.query('.host'));
  });
});
