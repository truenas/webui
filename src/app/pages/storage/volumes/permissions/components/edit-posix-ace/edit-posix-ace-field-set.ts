import { PosixAclTag } from 'app/enums/posix-acl.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { getFormUserGroupLoaders } from 'app/pages/storage/volumes/permissions/utils/get-form-user-group-loaders.utils';
import { UserService } from 'app/services';
import { T } from 'app/translate-marker';

export function getEditPosixAceFieldSet(userService: UserService): FieldSet[] {
  const {
    loadMoreUserOptions,
    loadMoreGroupOptions,
    updateUserSearchOptions,
    updateGroupSearchOptions,
  } = getFormUserGroupLoaders(userService);

  return [
    {
      name: helptext.dataset_acl_title_list,
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
              connective: RelationConnection.And,
              when: [
                {
                  name: 'tag',
                  operator: 'in',
                  value: [PosixAclTag.User, PosixAclTag.UserObject],
                },
                {
                  name: 'default',
                  operator: '!=',
                  value: true,
                },
              ],
            },
          ],
        },
        {
          type: 'combobox',
          name: 'group',
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
              connective: RelationConnection.And,
              when: [
                {
                  name: 'tag',
                  operator: 'in',
                  value: [PosixAclTag.Group, PosixAclTag.GroupObject],
                },
                {
                  name: 'default',
                  operator: '!=',
                  value: true,
                },
              ],
            },
          ],
        },
        {
          type: 'label',
          name: 'ownership-hint-user',
          label: helptext.dataset_ac_ownership_hint_user,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [
                {
                  name: 'tag',
                  operator: 'in',
                  value: [PosixAclTag.UserObject],
                },
                {
                  name: 'default',
                  operator: '!=',
                  value: true,
                },
              ],
            },
          ],
        },
        {
          type: 'label',
          name: 'ownership-hint-group',
          label: helptext.dataset_ac_ownership_hint_group,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [
                {
                  name: 'tag',
                  operator: 'in',
                  value: [PosixAclTag.GroupObject],
                },
                {
                  name: 'default',
                  operator: '!=',
                  value: true,
                },
              ],
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
