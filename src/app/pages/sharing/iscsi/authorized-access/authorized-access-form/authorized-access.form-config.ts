import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { helptextIscsi } from 'app/helptext/sharing';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import {
  doesNotEqualFgValidator,
  matchOthersFgValidator,
} from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import { ApiService } from 'app/modules/websocket/api.service';

export interface AuthorizedAccessFormValues {
  tag: number | null;
  user: string;
  secret: string;
  secret_confirm: string;
  peeruser: string;
  peersecret: string;
  peersecret_confirm: string;
  discovery_auth: IscsiAuthMethod;
}

const tooltips = helptextIscsi.authaccess;

export function getAuthorizedAccessFormConfig(
  api: ApiService,
  translate: TranslateService,
  editingAccess: IscsiAuthAccess | undefined,
): FormDefinition<AuthorizedAccessFormValues> {
  const isMutualChap = (value: AuthorizedAccessFormValues): boolean => {
    return value.discovery_auth === IscsiAuthMethod.ChapMutual;
  };

  return {
    addTitle: T('Add Authorized Access'),
    editTitle: T('Edit Authorized Access'),
    requiredRoles: [Role.SharingIscsiAuthWrite, Role.SharingIscsiWrite, Role.SharingWrite],
    formValidators: [
      matchOthersFgValidator('secret', ['secret_confirm'], translate.instant('Secret and confirmation should match.')),
      matchOthersFgValidator(
        'peersecret',
        ['peersecret_confirm'],
        translate.instant('Secret and confirmation should match.'),
      ),
      doesNotEqualFgValidator('peersecret', ['secret'], translate.instant('Secret and Peer Secret cannot be the same.')),
    ],
    sections: [
      {
        title: T('Authentication Method and Group'),
        fields: [
          {
            name: 'tag',
            type: 'input',
            inputType: 'number',
            label: T('Group ID'),
            tooltip: tooltips.tagTooltip,
            required: true,
            value: null,
            validators: [Validators.min(0)],
          },
          {
            name: 'discovery_auth',
            type: 'select',
            label: T('Discovery Authentication'),
            tooltip: helptextIscsi.portal.discoveryAuthMethodTooltip,
            required: true,
            value: IscsiAuthMethod.None,
            options: of([
              { label: 'NONE', value: IscsiAuthMethod.None },
              { label: 'CHAP', value: IscsiAuthMethod.Chap },
              { label: 'Mutual CHAP', value: IscsiAuthMethod.ChapMutual },
            ]),
          },
        ],
      },
      {
        title: T('User'),
        fields: [
          {
            name: 'user', type: 'input', label: T('User'), tooltip: tooltips.userTooltip, required: true,
          },
          {
            name: 'secret',
            type: 'input',
            inputType: 'password',
            label: T('Secret'),
            tooltip: tooltips.secretTooltip,
            required: true,
            validators: [Validators.minLength(12), Validators.maxLength(16)],
          },
          {
            name: 'secret_confirm', type: 'input', inputType: 'password', label: T('Secret (Confirm)'), required: true,
          },
        ],
      },
      {
        // Shown (and validated) only for Mutual CHAP; hidden fields are disabled,
        // so their required/length rules and the peer cross-field validators all
        // fall away automatically when another auth method is selected.
        title: T('Peer User'),
        visibleWhen: isMutualChap,
        fields: [
          {
            name: 'peeruser', type: 'input', label: T('Peer User'), tooltip: tooltips.peeruserTooltip, required: true,
          },
          {
            name: 'peersecret',
            type: 'input',
            inputType: 'password',
            label: T('Peer Secret'),
            tooltip: tooltips.peersecretTooltip,
            required: true,
            validators: [Validators.minLength(12), Validators.maxLength(16)],
          },
          {
            name: 'peersecret_confirm',
            type: 'input',
            inputType: 'password',
            label: T('Peer Secret (Confirm)'),
            required: true,
          },
        ],
      },
    ],
    submit: (event) => {
      const values = event.allValues;
      const mutual = isMutualChap(values);
      const payload = {
        tag: values.tag,
        user: values.user,
        secret: values.secret,
        // Peer credentials are meaningful only for Mutual CHAP; clear them otherwise.
        peeruser: mutual ? values.peeruser : '',
        peersecret: mutual ? values.peersecret : '',
        discovery_auth: values.discovery_auth,
      };

      return {
        request$: editingAccess
          ? api.call('iscsi.auth.update', [editingAccess.id, payload])
          : api.call('iscsi.auth.create', [payload]),
        successMessage: editingAccess
          ? translate.instant('Authorized access updated')
          : translate.instant('Authorized access added'),
      };
    },
  };
}
