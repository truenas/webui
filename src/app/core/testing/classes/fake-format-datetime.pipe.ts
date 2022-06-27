import { format } from 'date-fns-tz';
import { MockPipe } from 'ng-mocks';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const FakeFormatDateTimePipe = MockPipe(
  FormatDateTimePipe,
  jest.fn((date) => format(date, 'yyyy-MM-dd HH:mm:ss')),
);
