import { T } from "../../../translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_webdav = {
    placeholder_name: T('Share Name'),
    tooltip_name: T('Enter a name for the share.'),
    validator_name: [ Validators.required ],

    placeholder_comment: T('Comment'),
    tooltip_comment: T('Optional.'),

    placeholder_path: T('Path'),
    tooltip_path: T('Browse to the pool or dataset to share.'),
    validator_path: [ Validators.required ],

    placeholder_ro: T('Read Only'),
    tooltip_ro: T('Set to prohibit users from writing to this share.'),

    placeholder_perm: T('Change User & Group Ownership'),
    tooltip_perm: T('Select to automatically set the contents of the\
 share to the <i>webdav</i> user and group.')
}