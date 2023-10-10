
class add_Dataset:
    unencrypted_Error_Message = '//mat-error[contains(.,"Cannot create an unencrypted dataset within an encrypted dataset (encrypted)")]'


class breadcrumb:
    dashboard = '//a[text()="Dashboard"]'


class button:
    close = '//button[@ix-auto="button__CLOSE"]'
    save = '//button[@ix-auto="button__SAVE"]'
    advanced_options = '//button[@ix-auto="button__ADVANCED OPTIONS"]'
    initiate_failover = '//button[@ix-auto="button__INITIATE FAILOVER"]'
    failover = '//button[span/text()="Failover"]'
    leave_Domain = '//button[@ix-auto="button__LEAVE DOMAIN"]'
    i_Agree = '//button[@ix-auto="button__I AGREE"]'
    summit = '//button[@ix-auto="button__SUBMIT"]'


class checkbox:
    confirm = '//mat-checkbox[contains(.,"Confirm")]'
    enable = '//mat-checkbox[@ix-auto="checkbox__Enable"]'
    ad_enable = '//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]'


class dashboard:
    system_information = '//span[contains(.,"System Information")]'


class domain_Credentials:
    title = '//h4[contains(.,"Domain Credentials")]'


class input:
    username = '//input[@ix-auto="input__Username"]'
    password = '//input[@ix-auto="input__Password"]'


class isqsi:
    authorized_Access_Title = '//div[contains(text(),"Authorized Access")]'


class login:
    user_input = '//input[@placeholder="Username"]'
    password_input = '//input[@placeholder="Password"]'
    signin_button = '//button[@name="signin_button"]'

    def ha_status(message):
        return f'//p[contains(.,"{message}")]'


class pool:
    title = '//div[contains(text(),"Pools")]'


class popup:
    please_wait = '//h6[contains(.,"Please wait")]'
    initiate_failover = '//h1[text()="Initiate Failover"]'
    help = '//div[contains(.,"Looking for help?")]'
    leave_Domain_Title = '//h1[text()="Leave Domain"]'
    leave_Domain_Button = f'//mat-dialog-container{button.leave_Domain}'
    left_Domain_Message = '//span[text()="You have left the domain."]'


class sideMenu:
    """xpath for the menu on the left side"""
    root = '//span[contains(.,"root")]'
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    directory_services = '//mat-list-item[@ix-auto="option__Directory Services"]'
    directory_services_ldap = '//mat-list-item[@ix-auto="option__LDAP"]'
    directory_services_nis = '//mat-list-item[@ix-auto="option__NIS"]'
    pools = '//mat-list-item[@ix-auto="option__Pools"]'


class topToolbar:
    ha_enable = '//mat-icon[@svgicon="ha_enabled"]'
    ha_disabled = '//mat-icon[contains(.,"ha_disabled")]'


class aws:
    def aws_button(field):
        return f'(//button[@data-testid="{field}"])[1]'

    create_Folder_Button = aws_button('create-folder-button')
    delete_Button = aws_button('delete-objects-button')
    upload_Button = aws_button('upload-button')
    check_All_Checkbox = '(//input[contains(@class,"awsui_native-input")])[1]'
    create_The_Folder_Button = '//awsui-button[@class="createFolder-object-actions__actions-submit"]'
