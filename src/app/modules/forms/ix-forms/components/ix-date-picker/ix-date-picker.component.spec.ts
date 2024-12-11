import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { parseISO } from 'date-fns';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxDateAdapter } from 'app/modules/dates/services/ix-date-adapter';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { LocaleService } from 'app/services/locale.service';
import { IxDatepickerComponent } from './ix-date-picker.component';

describe('IxDatePickerComponent', () => {
  let spectator: SpectatorHost<IxDatepickerComponent>;
  let loader: HarnessLoader;
  const formControl = new FormControl<Date>(null);

  const createHost = createHostFactory({
    component: IxDatepickerComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(LocaleService, {
        // User timezone is UTC+2, as set in jest config.
        // Machine timezone is UTC+1, resulting machine timezone being -1 compared to user timezone.
        timezone: 'Europe/Berlin',
      }),
    ],
    componentProviders: [
      IxDateAdapter,
      FormatDateTimePipe,
      {
        provide: DateAdapter,
        deps: [IxDateAdapter],
        useFactory: (dateAdapter: IxDateAdapter) => {
          jest.spyOn(dateAdapter, 'format').mockImplementation(() => 'January 1st, 2021');
          jest.spyOn(dateAdapter, 'parse').mockImplementation(() => new Date(2021, 0, 2, 0, 0, 0));
          return dateAdapter;
        },
      },
    ],
  });

  describe('rendering', () => {
    it('shows label with form label, tooltip and required values', () => {
      spectator = createHost(`<ix-datepicker
        label="Label"
        tooltip="Tooltip"
        [required]="true"
        [formControl]="formControl"
      ></ix-datepicker>`, {
        hostProps: {
          formControl,
        },
      });

      const label = spectator.query(IxLabelComponent);
      expect(label).toExist();
      expect(label.label()).toBe('Label');
      expect(label.tooltip()).toBe('Tooltip');
      expect(label.required()).toBe(true);
    });

    it('opens datepicker when input is clicked', async () => {
      spectator = createHost('<ix-datepicker [formControl]="formControl"></ix-datepicker>', {
        hostProps: {
          formControl,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const input = await loader.getHarness(MatInputHarness);
      await input.focus();

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      expect(await datepicker.isCalendarOpen()).toBe(true);
    });

    it('passes min and max in browser timezone params to mat-datepicker', async () => {
      spectator = createHost('<ix-datepicker [formControl]="formControl" [min]="min" [max]="max"></ix-datepicker>', {
        hostProps: {
          formControl,
          min: new Date(2020, 0, 1, 12, 0, 0),
          max: new Date(2020, 0, 2, 12, 0, 0),
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      expect(await datepicker.getMin()).toBe('2020-01-01');
      expect(await datepicker.getMax()).toBe('2020-01-02');
    });
  });

  describe('form control', () => {
    it('shows form control value in browser timezone in the input', async () => {
      spectator = createHost('<ix-datepicker [formControl]="formControl"></ix-datepicker>', {
        hostProps: {
          formControl,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      formControl.setValue(parseISO('2021-01-01T23:00:00+01:00'));

      const input = await loader.getHarness(MatInputHarness);

      expect(await input.getValue()).toMatch('January 1st, 2021');
    });

    it('updates form control with date in machine timezone when user types in new date', async () => {
      spectator = createHost('<ix-datepicker [formControl]="formControl"></ix-datepicker>', {
        hostProps: {
          formControl,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      await datepicker.setValue('January 2nd, 2021');

      expect(formControl.value).toEqual(parseISO('2021-01-01T23:00:00Z'));
    });

    it('updates form control with date in machine timezone when user selects new date in datepicker', async () => {
      spectator = createHost('<ix-datepicker [formControl]="formControl"></ix-datepicker>', {
        hostProps: {
          formControl,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const datepicker = await loader.getHarness(MatDatepickerInputHarness);
      await datepicker.openCalendar();
      const calendar = await datepicker.getCalendar();
      await calendar.changeView(); // Switch to years
      await calendar.selectCell({ text: '2024' });
      await calendar.selectCell({ text: 'JAN' });
      await calendar.selectCell({ text: '4' });

      expect(formControl.value).toEqual(parseISO('2024-01-03T23:00:00.000Z'));
    });
  });
});
