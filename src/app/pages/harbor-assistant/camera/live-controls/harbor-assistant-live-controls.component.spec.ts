import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { HarborAssistantLiveControlsComponent } from './harbor-assistant-live-controls.component';

describe('HarborAssistantLiveControlsComponent', () => {
  let spectator: Spectator<HarborAssistantLiveControlsComponent>;
  const createComponent = createComponentFactory({
    component: HarborAssistantLiveControlsComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        currentTime: 1198,
        endTime: 1200,
        paused: false,
        playbackMode: 'webrtc',
        playbackRate: 1,
        startTime: 0,
      },
    });
  });

  it('renders the live timeline without browser-native controls', () => {
    expect(spectator.query('[data-testid="harbor-assistant-live-controls"]')).toBeTruthy();
    expect(spectator.query('.time-label')).toHaveText('19:58 / 20:00');
    expect(spectator.query('.transport-label')).toHaveText('WebRTC');
  });

  it('emits playback toggle and a committed seek target', () => {
    const toggleSpy = jest.spyOn(spectator.component.playbackToggle, 'emit');
    const seekSpy = jest.spyOn(spectator.component.seekRequested, 'emit');
    const timeline = spectator.query<HTMLInputElement>('#live-timeline');
    expect(timeline).toBeTruthy();

    spectator.click('button[aria-label="Pause"]');
    expect(toggleSpy).toHaveBeenCalled();

    if (timeline) {
      timeline.value = '900';
      spectator.dispatchFakeEvent(timeline, 'input');
      spectator.dispatchFakeEvent(timeline, 'change');
    }
    expect(seekSpy).toHaveBeenCalledWith(900);
  });

  it('offers the existing catch-up playback rates', () => {
    const rateSpy = jest.spyOn(spectator.component.playbackRateChange, 'emit');
    spectator.click('button[aria-label="Playback speed"]');
    const rateButton = spectator.queryAll<HTMLButtonElement>('.speed-menu button')
      .find((button) => button.textContent?.trim() === '2×');
    expect(rateButton).toBeTruthy();

    if (rateButton) {
      spectator.click(rateButton);
    }
    expect(rateSpy).toHaveBeenCalledWith(2);
  });
});
