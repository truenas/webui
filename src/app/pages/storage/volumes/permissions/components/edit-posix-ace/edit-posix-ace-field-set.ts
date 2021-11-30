import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EditPosixAceComponent } from 'app/pages/storage/volumes/permissions/components/edit-posix-ace/edit-posix-ace.component';
import { getFormUserGroupLoaders } from 'app/pages/storage/volumes/permissions/utils/get-form-user-group-loaders.utils';
import { UserService } from 'app/services';

export function getEditPosixAceFieldSet(this: EditPosixAceComponent, userService: UserService): FieldSet[] {
  const {
    loadMoreUserOptions,
    loadMoreGroupOptions,
    updateUserSearchOptions,
    updateGroupSearchOptions,
  } = getFormUserGroupLoaders(userService);

  return [
    {
      name: helptext.dataset_acl_title_entry,
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: 'tag',
          placeholder: helptext.posix_tag.placeholder,
          tooltip: helptext.posix_tag.tooltip,
          options: helptext.posix_tag.options,
          required: true,
        },
        {
          type: 'combobox',
          name: 'user',
          parent: this,
          placeholder: helptext.dataset_acl_user_placeholder,
          tooltip: helptext.dataset_acl_user_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          updater: updateUserSearchOptions,
          loadMoreOptions: loadMoreUserOptions,
          isHidden: true,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'tag',
                value: PosixAclTag.User,
              }],
            },
          ],
        },
        {
          type: 'combobox',
          name: 'group',
          parent: this,
          placeholder: helptext.dataset_acl_group_placeholder,
          tooltip: helptext.dataset_acl_group_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          updater: updateGroupSearchOptions,
          loadMoreOptions: loadMoreGroupOptions,
          isHidden: true,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'tag',
                value: PosixAclTag.Group,
              }],
            },
          ],
        },
        {
          type: 'selectionlist',
          name: 'permissions',
          inlineFields: true,
          inlineFieldFlex: '33%',
          placeholder: helptext.posix_perms.placeholder,
          tooltip: helptext.posix_perms.tooltip,
          options: helptext.posix_perms.options,
        },
        {
          type: 'label',
          name: 'flagsLabel',
          label: T('Flags'),
        },
        {
          type: 'checkbox',
          name: 'default',
          placeholder: helptext.posix_default.placeholder,
          tooltip: helptext.posix_default.tooltip,
          isHidden: false,
        },
      ],
    },
  ];
}
