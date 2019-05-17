import { Validators } from "@angular/forms";
import { T } from "../../translate-marker";

export const helptext_system_acme = {
    select_auth_label: T('Select Authenticator'),

    authenticator_name_name: 'name',
    authenticator_name_placeholder : T('Name'),
    authenticator_name_tooltip : T('Temp tooltip'),
    authenticator_name_validation : Validators.required,

    authenticator_provider_name: 'authenticator',
    authenticator_provider_placeholder : T('Authenticator'),
    authenticator_provider_tooltip : T('Temp tooltip'),

    auth_attributes_label: T('Authenticator Attributes'),

    auth_credentials_1_name: 'access_key_id-route53',
    auth_credentials_1_placeholder : T('Access ID Key'),
    auth_credentials_1_tooltip : T('Temp tooltip'),
    auth_credentials_1_validation : Validators.required,

    auth_credentials_2_name: 'secret_access_key-route53',
    auth_credentials_2_placeholder : T('Secret Access Key'),
    auth_credentials_2_tooltip : T('Temp tooltip'),
    auth_credentials_2_validation : Validators.required
}