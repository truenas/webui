import { TranslateService } from '@ngx-translate/core';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getNtpServersFormConfig } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers.form-config';

describe('getNtpServersFormConfig', () => {
  const allValues = {
    address: 'ua.pool.ntp.org', burst: true, iburst: false, prefer: false, minpoll: 6, maxpoll: 10, force: false,
  } as CreateNtpServer;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request when no server is being edited', () => {
    const definition = getNtpServersFormConfig(api, translate, undefined);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<CreateNtpServer>);

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.create', [allValues]);
  });

  it('builds an update request scoped to the edited server id', () => {
    const definition = getNtpServersFormConfig(api, translate, { id: 7 } as NtpServer);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<CreateNtpServer>);

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.update', [7, allValues]);
  });
});
