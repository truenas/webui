
class add_Dataset:
    unencrypted_Error_Message = '//mat-error[contains(.,"Cannot create an unencrypted dataset within an encrypted dataset (encrypted)")]'


class authorization:
    box_Auth_Message = '//*[contains(text(),"Read and write all files and folders stored in Box")]'
    Grant_Access_To_Box_Button = '//button[@id="consent_accept_button"]'


class aws:
    def aws_button(field: str):
        return f'(//button[@data-testid="{field}"])[1]'

    def folder_header(folder_name: str):
        """
        xpath for the bucket header
        :param folder_name: name of the bucket
        :return: the xpath of the bucket header
        """
        return f'//h1[contains(.,"{folder_name}")]'

    create_Folder_Button = aws_button('create-folder-button')
    delete_Button = aws_button('delete-objects-button')
    upload_Button = aws_button('upload-button')
    check_All_Checkbox = '//input[@type="checkbox" and @tabindex="-1"]'
    create_The_Folder_Button = '//button[contains(@class,"createFolder-object-actions__actions-submit")]'
    delete_Objects_Button = '//button[contains(@class,"delete-objects__actions-submit")]'
    close = '//button[contains(@class,"delete-objects__exit")]'


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
    close_Popover = '//button[@title="Close popover"]'


class checkbox:
    confirm = '//mat-checkbox[contains(.,"Confirm")]'
    enable = '//mat-checkbox[@ix-auto="checkbox__Enable"]'
    ad_enable = '//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]'


class dashboard:
    system_information = '//span[contains(.,"System Information")]'


class domain_Credentials:
    title = '//h4[contains(.,"Domain Credentials")]'


class google_Drive:
    name_Sort = '//div[contains(text(),"Name") and @role="button"]'
    music_Folder = '//div[@data-tooltip="Google Drive Folder: music"]'
    move_To_Trash = '//div[text()="Move to trash?"]'
    pdf_file = '//div[@aria-label="Explaining_BSD.pdf PDF"]'
    image_file = '//div[@aria-label="Gloomy_Forest_wallpaper_ForWallpapercom.jpg Image"]'
    mp3_file = '//div[@aria-label="Mr_Smith_Pequeñas_Guitarras.mp3 Audio"]'


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
    accounts = '//mat-list-item[@ix-auto="option__Accounts"]'
    users = '//mat-list-item[@ix-auto="option__Users"]'
    directory_services = '//mat-list-item[@ix-auto="option__Directory Services"]'
    directory_services_ldap = '//mat-list-item[@ix-auto="option__LDAP"]'
    directory_services_nis = '//mat-list-item[@ix-auto="option__NIS"]'
    pools = '//mat-list-item[@ix-auto="option__Pools"]'


class topToolbar:
    ha_enable = '//mat-icon[@svgicon="ha_enabled"]'
    ha_disabled = '//mat-icon[contains(.,"ha_disabled")]'
