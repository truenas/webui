import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemSupport = {
  proactive: {
    title: T('Proactive Support'),
    instructions: T('Silver / Gold Coverage Customers can enable iXsystems Proactive Support. This \
 automatically emails iXsystems when certain conditions occur on this TrueNAS system. The iX Support \
 Team will promptly communicate with the Contacts saved below to quickly resolve any issue that may \
 have occurred on the system.'),
    primary_contact: T('Primary Contact'),
    pc_name_placeholder: T('Name'),
    pc_title_placeholder: T('Title'),
    pc_email_placeholder: T('Email'),
    pc_phone_placeholder: T('Phone Number'),
    pc_validation: [Validators.required],
    pc_email_validation: [Validators.required, Validators.email],

    secondary_contact: T('Secondary Contact'),
    sec_name_placeholder: T('Secondary Name'),
    sec_title_placeholder: T('Secondary Title'),
    sec_email_placeholder: T('Secondary Email'),
    sec_phone_placeholder: T('Secondary Phone Number'),
    sec_email_validation: [Validators.required, Validators.email],

    enable_checkbox_placeholder: T('Enable iXsystems Proactive Support'),
    save_button: T('Save'),
    dialog_title: T('Settings saved'),
    dialog_mesage: T('Successfully saved proactive support settings.'),
    dialog_err: T('Error Saving Proactive Support Settings'),
    dialog_unavailable_title: T('Warning'),
    dialog_unavailable_warning: T('Proactive support settings is not available.'),
  },

  token: {
    placeholder: T('OAuth Token'),
    tooltip: T('OAuth Token for current session'),
  },

  type: {
    placeholder: T('Type'),
    tooltip: T('Select <i>Bug</i> when reporting an issue or <i>Suggestion</i> when requesting new functionality.'),
  },

  name: {
    tooltip: T('Enter the name of the contact person.'),
  },

  email: {
    tooltip: T('Enter the email of the contact person. Use the format <i>name</i>@<i>domain.com</i>.'),
  },

  cc: {
    tooltip: T('Email addresses to receive copies of iXsystems Support \
  messages about this issue. Use the format <i>name</i>@<i>domain.com</i>. \
  Separate entries by pressing <code>Enter</code>.'),
    err: T('Email addresses must be entered in the format \
  <i>local-name</i>@<i>domain.com<i>, with entries separated by pressing \
  <code>Enter</code>.'),
  },

  phone: {
    tooltip: T('Enter the phone number of the contact person.'),
  },

  category: {
    placeholder: T('Category'),
    tooltip: T(
      'This field remains empty until a valid\
 <b>Username</b> and <b>Password</b> is entered.\
 Choose the category that best describes the bug or\
 feature being reported.',
    ),
  },

  environment: {
    tooltip: T('Select the appropriate environment.'),
  },

  criticality: {
    tooltip: T('Select the appropriate level of criticality.'),
  },

  attach_debug: {
    placeholder: T('Attach Debug'),
    tooltip: T(
      'Set to generate and attach to the new issue a report\
 containing an overview of the system hardware, build\
 string, and configuration. This can take several\
 minutes.',
    ),
  },

  title: {
    placeholder: T('Subject'),
    tooltip: T('Enter a descriptive title for the new issue.'),
  },

  body: {
    placeholder: T('Description'),
    tooltip: T(
      'Enter a one to three paragraph summary of the issue.\
 Describe the problem and provide any steps to\
 replicate the issue.',
    ),
  },

  screenshot: {
    placeholder: T('Attach screenshots.'),
    tooltip: T('Select one or more screenshots that illustrate the problem.'),
  },

  update_license: {
    license_placeholder: T('License'),
    reload_dialog_title: T('Reload the page'),
    reload_dialog_message: T('Reload the page for the license to take effect.'),
    reload_dialog_action: T('Reload now'),
  },

  is_production_error_dialog: {
    title: T('Error Updating Production Status'),
  },

  is_production_job: {
    title: T('Production Status'),
    message: T('Updating production status...'),
  },

  is_production_dialog: {
    title: T('Status updated'),
    message: T('Production status successfully updated'),
  },

  submitBtn: T('Save'),

  docHub: T('<a href="https://www.truenas.com/docs/hub/" target="_blank">\
 TrueNAS Documentation Hub</a> - Read and contribute to the open-source documentation.'),

  forums: T('<a href="https://www.ixsystems.com/community/" target="_blank">\
 TrueNAS Forums</a> - Find answers from other users in the forums.'),

  licensing: T('<a href="https://www.ixsystems.com/support/" target="_blank">\
 TrueNAS Licensing</a> - Learn more about enterprise-grade support.'),

  updateTxt: T('Update License'),
  enterTxt: T('Add License'),
  ticket: T('File Ticket'),
  debugSizeLimitWarning: T('The ticket was created successfully (see link below), but the debug file\
   failed to attach. Please download the debug manually \
   (System → Advanced → Save Debug), upload it to a third-party storage service and provide\
    a link in the JIRA issue comment.'),

  updateProd: {
    title: T('Update Production Status'),
    message: T('Set production status as active'),
    checkbox: T('Send initial debug'),
    button: T('Proceed'),
  },

};
