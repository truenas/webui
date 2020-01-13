import { T } from '../../translate-marker';
import {Validators} from '@angular/forms';
import {
  regexValidator
} from '../../pages/common/entity/entity-form/validators/regex-validation';
import { UserService } from 'app/services';

export default {

fieldset_name: T('Group Configuration'),
bsdgrp_gid_placeholder: T('GID'),
bsdgrp_gid_tooltip: T('The Group ID (GID) is a unique number used to identify\
 a Unix group. Enter a number above 1000 for a group\
 with user accounts. Groups used by a service must have\
 an ID that matches the default port number used by the\
 service.'),
bsdgrp_gid_validation: [ Validators.required, regexValidator(/^\d+$/) ],

bsdgrp_group_placeholder: T('Name'),
bsdgrp_group_tooltip: T('Group name cannot begin with a hyphen\
 (<i>-</i>) or contain a space, tab, or these characters:\
 <i>, : + & # % ^ ( ) ! @ ~ * ? < > =</i>. <i>$</i> can only be used\
 as the last character of the username.'),

bsdgrp_sudo_placeholder: T('Permit Sudo'),
bsdgrp_sudo_tooltip: T('Allow group members to use <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=sudo&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">sudo</a>. Group members are prompted\
 for their password when using <b>sudo</b>.'),

allow_placeholder: T('Allow Duplicate GIDs'),
allow_tooltip: T('<b>Not recommended.</b> Allow more than one group to \
 have the same group ID.'),

}
