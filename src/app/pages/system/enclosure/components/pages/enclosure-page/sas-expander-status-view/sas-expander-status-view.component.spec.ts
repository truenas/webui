import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureElements, EnclosureElement } from 'app/interfaces/enclosure.interface';
import {
  SasExpanderStatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';

describe('SasExpanderStatusViewComponent', () => {
  let spectator: Spectator<SasExpanderStatusViewComponent>;
  const createComponent = createComponentFactory({
    component: SasExpanderStatusViewComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        enclosure: {
          elements: {
            [EnclosureElementType.ArrayDeviceSlot]: {},
            [EnclosureElementType.SasExpander]: {
              27: {
                status: 'OK',
                descriptor: 'SAS Expander 1',
              } as EnclosureElement,
              28: {
                status: 'OK',
              } as EnclosureElement,
            },
          } as DashboardEnclosureElements,
        } as DashboardEnclosure,
      },
    });
  });

  it('shows expanders and their info', () => {
    const expanders = spectator.queryAll('.expander');
    expect(expanders).toHaveLength(2);
    expect(expanders[0]).toHaveDescendantWithText({
      selector: '.status-value',
      text: 'OK',
    });
    expect(expanders[0]).toHaveDescendantWithText({
      selector: '.descriptor',
      text: 'SAS Expander 1',
    });

    expect(expanders[1]).toHaveDescendantWithText({
      selector: '.status-value',
      text: 'OK',
    });
    expect(expanders[1]).toHaveDescendantWithText({
      selector: '.descriptor',
      text: 'No descriptor provided',
    });
  });
});
