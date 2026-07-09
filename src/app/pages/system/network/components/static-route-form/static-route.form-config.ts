import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextStaticRoutes } from 'app/helptext/network/static-routes/static-routes';
import { StaticRoute, UpdateStaticRoute } from 'app/interfaces/static-route.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ipv4or6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';

export function getStaticRouteFormConfig(
  api: ApiService,
  translate: TranslateService,
  editingRoute: StaticRoute | undefined,
): FormDefinition<UpdateStaticRoute> {
  return {
    addTitle: T('Add Static Route'),
    editTitle: T('Edit Static Route'),
    requiredRoles: [Role.NetworkInterfaceWrite],
    sections: [{
      title: T('General Options'),
      fields: [
        {
          name: 'destination', type: 'input', label: T('Destination'), tooltip: helptextStaticRoutes.destinationTooltip, required: true,
        },
        {
          name: 'gateway',
          type: 'input',
          label: T('Gateway'),
          tooltip: helptextStaticRoutes.gatewayTooltip,
          required: true,
          validators: [ipv4or6Validator()],
        },
        { name: 'description', type: 'input', label: T('Description') },
      ],
    }],
    submit: (event) => ({
      request$: editingRoute
        ? api.call('staticroute.update', [editingRoute.id, event.allValues])
        : api.call('staticroute.create', [event.allValues]),
      successMessage: editingRoute
        ? translate.instant('Static route updated')
        : translate.instant('Static route added'),
    }),
  };
}
