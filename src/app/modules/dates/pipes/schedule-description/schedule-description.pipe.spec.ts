import {
  createServiceFactory,
  mockProvider,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { Schedule } from 'app/interfaces/schedule.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';

describe('ScheduleDescriptionPipe', () => {
  let spectator: SpectatorService<ScheduleDescriptionPipe>;

  const createPipe = createServiceFactory({
    service: ScheduleDescriptionPipe,
    providers: [
      mockProvider(LocaleService, {
        getShortTimeFormat: () => 'HH:mm',
        getPreferredTimeFormat: () => 'HH:mm:ss',
      }),
      mockProvider(LanguageService, {
        currentLanguage: 'en',
      }),
    ],
  });

  it('describes schedule without `begin` and `end` fields', () => {
    spectator = createPipe();

    expect(spectator.service.transform({
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '*',
    })).toBe('At 00:00, every day');

    expect(spectator.service.transform({
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '1',
    })).toBe('At 00:00, only on Monday');

    expect(spectator.service.transform({
      minute: '0',
      hour: '0',
      dom: '1',
      month: '*',
      dow: '*',
    })).toBe('At 00:00, on day 1 of the month');

    expect(spectator.service.transform({
      minute: '0',
      hour: '0',
      dom: '*',
      month: '1',
      dow: '*',
    })).toBe('At 00:00, every day, only in January');

    expect(spectator.service.transform({
      minute: '20',
      hour: '*/2',
      dom: '*',
      month: '*',
      dow: '1,2,3,4,5',
    })).toBe('At 20 minutes past the hour, every 2 hours, only on Monday, Tuesday, Wednesday, Thursday, and Friday');
  });

  it("uses user's language when describing the schedule", () => {
    spectator = createPipe({
      providers: [
        mockProvider(LanguageService, {
          currentLanguage: 'uk',
        }),
      ],
    });

    expect(spectator.service.transform({
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '*',
    })).toBe('О 00:00, щоденно');

    expect(spectator.service.transform({
      minute: '20',
      hour: '*/2',
      dom: '*',
      month: '*',
      dow: '1,2',
    })).toBe('О 20 хвилині, кожні 2 годин, тільки в понеділок та вівторок');
  });

  it("uses user's time 12/24h time format preference when describing the schedule", () => {
    spectator = createPipe({
      providers: [
        mockProvider(LocaleService, {
          getPreferredTimeFormat: () => 'hh:mm:ss',
        }),
      ],
    });

    expect(spectator.service.transform({
      minute: '45',
      hour: '14',
      dom: '*',
      month: '*',
      dow: '*',
    })).toBe('At 02:45 PM, every day');
  });

  it('returns an empty string when invalid schedule is provided and logs console error', () => {
    spectator = createPipe();
    jest.spyOn(console, 'error').mockImplementation();

    expect(spectator.service.transform({})).toBe('');
    expect(spectator.service.transform(undefined as unknown as Schedule)).toBe('');
    expect(spectator.service.transform(null as unknown as Schedule)).toBe('');

    expect(console.error).toHaveBeenCalledTimes(3);
  });

  describe('when `begin` and `end` are set', () => {
    it('describes schedule with `begin` and `end` fields', () => {
      spectator = createPipe();

      expect(spectator.service.transform({
        minute: '0',
        hour: '*',
        dom: '*',
        month: '*',
        dow: '*',
        begin: '02:15',
        end: '23:00',
      })).toBe('Every hour, every day, from 02:15 to 23:00');
    });

    it("uses user's time 12/24h time format preference for schedule with `begin` and `end`", () => {
      spectator = createPipe({
        providers: [
          mockProvider(LocaleService, {
            getShortTimeFormat: () => 'hh:mm aa',
            getPreferredTimeFormat: () => 'hh:mm:ss aa',
          }),
        ],
      });

      expect(spectator.service.transform({
        minute: '0',
        hour: '*',
        dom: '*',
        month: '*',
        dow: '*',
        begin: '02:15',
        end: '23:00',
      })).toBe('Every hour, every day, from 02:15 AM to 11:00 PM');
    });
  });
});
