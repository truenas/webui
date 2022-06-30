import { byText, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { SmartTestResults } from 'app/interfaces/smart-test.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services';
import { SmartInfoCardComponent } from './smart-info-card.component';

describe('SmartInfoCardComponent', () => {
  let spectator: Spectator<SmartInfoCardComponent>;
  const createComponent = createComponentFactory({
    component: SmartInfoCardComponent,
    providers: [
      mockWebsocket([
        mockCall('smart.test.results', [
          {
            disk: 'sdc',
            tests: [
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Running,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
              {
                lba_of_first_error: 2334,
                status: SmartTestResultStatus.Failed,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
              {
                lba_of_first_error: null,
                status: SmartTestResultStatus.Success,
              },
            ],
          } as SmartTestResults,
        ]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        topologyItem: {
          disk: 'sdc',
        } as VDev,
      },
    });
  });

  it('loads and shows total number of SMART test results', () => {
    const detailsItem = spectator.query(byText('Total S.M.A.R.T. Test Results:')).parentElement;
    expect(detailsItem).toHaveDescendantWithText({
      selector: '.value',
      text: '4',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('smart.test.results', [[['disk', '=', 'sdc']]]);
  });
});
