import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_support = {
  username: {
    placeholder: T("Username"),
    tooltip: T(
      'Enter a valid username for the <a\
 href="https://jira.ixsystems.com/projects/NAS/issues/"\
 target="_blank">FreeNAS bug tracking system</a>'
    ),
    validation: [Validators.required]
  },

  password: {
    placeholder: T("Password"),
    tooltip: T("Enter the bug tracker account password."),
    validation: [Validators.required]
  },

  type: {
    placeholder: T("Type"),
    tooltip: T(
      "Select <i>Bug</i> when reporting an issue or\
 <i>Feature</i> when requesting new functionality."
    )
  },

  name: {
    placeholder: T("Name"),
    tooltip: T("Enter the name of the contact person."), //DRAFT TOOLTIP
    validation: [Validators.required]
  },

  email: {
    placeholder: T("Email"),
    tooltip: T("Enter the email of the contact person."), //DRAFT TOOLTIP
    validation: [Validators.required, Validators.email]
  },

  phone: {
    placeholder: T("Phone"),
    tooltip: T("Enter the phone number of the contact person."), //DRAFT TOOLTIP
    validation: [Validators.required]
  },

  category: {
    placeholder: T("Category"),
    tooltip: T(
      "This field remains empty until a valid\
 <b>Username</b> and <b>Password</b> is entered.\
 Choose the category that best describes the bug or\
 feature being reported."
    ),
    validation: [Validators.required]
  },

  environment: {
    placeholder: T("Environment"),
    tooltip: T("Select the appropriate environment."), //DRAFT TOOLTIP
    validation: [Validators.required]
  },

  criticality: {
    placeholder: T("Criticality"),
    tooltip: T("Select the appropriate level of criticality."), //DRAFT TOOLTIP
    validation: [Validators.required]
  },

  attach_debug: {
    placeholder: T("Attach Debug"),
    tooltip: T(
      "Set to generate and attach to the new issue a report\
 containing an overview of the system hardware, build\
 string, and configuration. This can take several\
 minutes."
    )
  },

  title: {
    placeholder: T("Subject"),
    tooltip: T("Enter a descriptive title for the new issue."),
    validation: [Validators.required]
  },

  body: {
    placeholder: T("Description"),
    tooltip: T(
      "Enter a one to three paragraph summary of the issue.\
 Describe the problem and provide any steps to\
 replicate the issue."
    ),
    validation: [Validators.required]
  },

  screenshot: {
  placeholder: T( "Attach screenshots."),
  tooltip: T( "Select one or more screenshots that illustrate the problem.")
  },

  update_license: {
    open_dialog_button: T('Update License'),
    user_guide_button: T('User Guide (pdf)'),
    dialog_title: T('Update License'),
    license_placeholder: T('License'),
    save_button: T('Save License'),
    success_message: T('License has been updated.'),
    error_dialog_title: T('Error Unlocking'),
    snackbar_action: T('close')
  },

  is_production_checkbox: {
    placeholder: T('This is a production system.'),
    tooltip: T('Set system production state and optionally send initial debug.')
  },

  is_production_error_dialog: {
    title: T('Error Updating Production Status'),
  },

  is_production_snackbar: {
    message: T('Production status successfully uptated'),
    action: T('Close')
  }
};
