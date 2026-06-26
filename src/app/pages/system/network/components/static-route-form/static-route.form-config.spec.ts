import { TranslateService } from '@ngx-translate/core';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getStaticRouteFormConfig } from 'app/pages/system/network/components/static-route-form/static-route.form-config';

describe('getStaticRouteFormConfig', () => {
  const allValues = {
    destination: '10.24.12.13/16',
    gateway: '10.24.12.1',
    description: 'My route',
  } as UpdateStaticRoute;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request when no route is being edited', () => {
    const definition = getStaticRouteFormConfig(api, translate, undefined);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<UpdateStaticRoute>);

    expect(api.call).toHaveBeenCalledWith('staticroute.create', [allValues]);
  });

  it('builds an update request scoped to the edited route id', () => {
    const definition = getStaticRouteFormConfig(api, translate, { id: 13 } as StaticRoute);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<UpdateStaticRoute>);

    expect(api.call).toHaveBeenCalledWith('staticroute.update', [13, allValues]);
  });
});
