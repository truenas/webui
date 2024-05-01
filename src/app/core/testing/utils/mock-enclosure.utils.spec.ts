import { MockEnclosureUtils } from 'app/core/testing/utils/mock-enclosure.utils';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ResultMessage } from 'app/interfaces/api-message.interface';
import { EnclosureOld } from 'app/interfaces/enclosure-old.interface';

const fakeEnclosures = [
  {
    number: 1,
    label: 'Enclosure 1',
  },
  {
    number: 2,
    label: 'Enclosure 2',
  },
] as EnclosureOld[];

describe('MockEnclosureUtils', () => {
  const mockEnclosureUtils = new MockEnclosureUtils();

  it('returns enclosures in the result field when enclosure2.query is overwritten', () => {
    const result: ResultMessage = {
      id: 'result-id',
      msg: IncomingApiMessageType.Result,
    };

    mockEnclosureUtils.mockStorage.enclosures = fakeEnclosures;
    expect(mockEnclosureUtils.overrideMessage(result, 'enclosure2.query')).toEqual({
      ...result,
      result: fakeEnclosures,
    });
  });
});
