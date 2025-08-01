import { ChangeDetectionStrategy, Component, inject as inject_1 } from '@angular/core';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Weekday } from 'app/enums/weekday.enum';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { getResilverSummary } from './resilver-summary.util';

/**
 * Using dummy component to make it easier to get the translate instance.
 */
@Component({
  selector: 'ix-dummy-component',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DummyComponent {
  translate = inject_1(TranslateService);
}

describe('getResilverSummary', () => {
  let translate: TranslateService;

  const createComponent = createComponentFactory({
    component: DummyComponent,
  });

  beforeEach(() => {
    const spectator = createComponent();
    translate = spectator.inject(TranslateService);
  });

  it('should return "Never" when resilver is disabled', () => {
    const config = {
      enabled: false,
      begin: '00:00',
      end: '00:00',
      weekday: [],
    } as ResilverConfig;

    const result = getResilverSummary(config, translate);
    expect(result).toBe('Never');
  });

  it('should return summary for every day of the week', () => {
    const config = {
      enabled: true,
      begin: '08:00',
      end: '18:00',
      weekday: [
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
        Weekday.Saturday,
        Weekday.Sunday,
      ],
    } as ResilverConfig;

    const result = getResilverSummary(config, translate);
    expect(result).toBe('Between 08:00 and 18:00 every day of the week');
  });

  it('should return summary for weekends', () => {
    const config = {
      enabled: true,
      begin: '10:00',
      end: '20:00',
      weekday: [
        Weekday.Saturday,
        Weekday.Sunday,
      ],
    } as ResilverConfig;

    const result = getResilverSummary(config, translate);
    expect(result).toBe('Between 10:00 and 20:00 on weekends');
  });

  it('should return summary for weekdays', () => {
    const config = {
      enabled: true,
      begin: '09:00',
      end: '17:00',
      weekday: [
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
      ],
    } as ResilverConfig;

    const result = getResilverSummary(config, translate);
    expect(result).toBe('Between 09:00 and 17:00 on weekdays');
  });

  it('should return summary for specific days', () => {
    const config = {
      enabled: true,
      begin: '09:00',
      end: '17:00',
      weekday: [
        Weekday.Monday,
        Weekday.Wednesday,
      ],
    } as ResilverConfig;

    const result = getResilverSummary(config, translate);
    expect(result).toBe('Between 09:00 and 17:00 on Monday, Wednesday');
  });
});
