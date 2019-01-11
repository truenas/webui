import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
volume_delete_name_label: T('name'),

volume_delete_destroy_label: T('destroy'),
volume_delete_destroy_placeholder: T("Destroy data on this pool?"),
volume_delete_destroy_tooltip: T("Set to permanently erase all information stored on\
 this pool when the detach operation is confirmed."),

volume_delete_confirm_detach_checkbox_label: T("Confirm it is okay to proceed with Detach."),
volume_delete_confirm_detach_checkbox_placeholder: T("Confirm detach"),
volume_delete_confirm_detach_checkbox_tooltip: T("Set to confirm detaching the pool."),
volume_delete_confirm_detach_checkbox_validation: [Validators.required]
}