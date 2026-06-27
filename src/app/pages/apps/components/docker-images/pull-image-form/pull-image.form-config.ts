import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { latestVersion } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { PullContainerImageParams } from 'app/interfaces/container-image.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface PullImageFormValues {
  image: string;
  tag: string;
  username: string;
  password: string;
}

export function getPullImageFormConfig(
  api: ApiService,
  translate: TranslateService,
  dialogService: DialogService,
): FormDefinition<PullImageFormValues> {
  return {
    title: T('Pull Image'),
    requiredRoles: [Role.AppsWrite],
    sections: [
      {
        fields: [
          {
            name: 'image',
            type: 'input',
            label: T('Image Name'),
            tooltip: helptextApps.pullImageForm.imageName.tooltip,
            required: true,
          },
          {
            name: 'tag',
            type: 'input',
            label: T('Image Tag'),
            value: latestVersion,
          },
        ],
      },
      {
        title: T('Docker Registry Authentication'),
        fields: [
          {
            name: 'username',
            type: 'input',
            label: T('Username'),
            hint: T('Optional. Only needed for private images.'),
          },
          {
            name: 'password',
            type: 'input',
            inputType: 'password',
            label: T('Password'),
          },
        ],
      },
    ],
    submit: (event) => {
      const values = event.allValues;
      const params: PullContainerImageParams = {
        image: values.image,
      };
      if (values.tag) {
        params.image += ':' + values.tag;
      }
      if (values.username || values.password) {
        params.auth_config = {
          username: values.username,
          password: values.password,
        };
      }

      return {
        request$: dialogService.jobDialog(
          api.job('app.image.pull', [params]),
          { title: translate.instant('Pulling...') },
        ).afterClosed(),
        successMessage: translate.instant('Image pulled'),
        closeWith: () => true,
      };
    },
  };
}
