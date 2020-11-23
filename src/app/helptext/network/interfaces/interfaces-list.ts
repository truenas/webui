import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { rangeValidator } from '../../../pages/common/entity/entity-form/validators/range-validation';

export default {
pending_changes_text : T('There are unapplied network interface changes that must be tested before being permanently saved. Test changes now?'),

checkin_text: T("Test network interface changes for "),
checkin_text_2: T(" seconds."),

pending_checkin_dialog_text : T('Network interface changes have been temporarily applied for testing. Keep changes permanently?\
 Changes are automatically reverted after the testing delay if they are not permanently applied.'),

pending_checkin_text : T('Network interface settings have been temporarily changed for testing. The settings will revert to the previous configuration after'),
pending_checkin_text_2 : T('seconds unless SAVE CHANGES is chosen to make them permanent.'),

commit_changes_title: T("Test Changes"),
commit_changes_warning: T("Test network interface changes? Network connectivity can be interrupted."),

changes_saved_successfully: T("Network changes applied successfully."),

commit_button: T("Test Changes"),
keep_button: T("Save Changes"),
rollback_button: T("Revert Changes"),
rollback_changes_title: T("Revert Network Interface Changes"),
rollback_changes_warning: T("Revert interface changes? All changes that are being tested will be lost."),
changes_rolled_back: T("Interface changes reverted."),

services_restarted: {
    title: T('Attention'),
    message_a: T('These IP Addresses were removed:'),
    message_b: T('The listed services will be changed to listen on 0.0.0.0:'),
    button: T('Continue')
},

checkin_title: T("Save Changes"),
checkin_message: T("Save network interface changes?"),
checkin_complete_title: T("Changes Saved"),
checkin_complete_message: T("Network interface changes have been made permanent."),
checkin_button: T('Save'),

pending_changes_title: T("Pending Network Changes"),
pending_changes_message: T("There are pending network interface changes. Review them now?"),

ha_enabled_edit_title: T("Cannot Edit while HA is Enabled"),
ha_enabled_edit_msg: T("Editing interfaces while HA is enabled is not allowed."),

ha_enabled_delete_title: T("Cannot Delete while HA is Enabled"),
ha_enabled_delete_msg: T("Deleting interfaces while HA is enabled is not allowed."),

ha_enabled_text: T("Cannot edit while HA is enabled."),
go_to_ha: T("Go to HA settings"),

delete_dialog_text: T("This change can interrupt connectivity and must be tested before making permanent. ")
}
