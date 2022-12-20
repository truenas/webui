
class activeDirectory:
    title = '//h3[@class="ix-formtitle" and text()="Active Directory"]'
    enableCheckbox = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'


class addUser:
    title = '//h3[text()="Add User"]'
    edit_title = '//h3[text()="Edit User"]'
    fullName_input = '//ix-input[@formcontrolname="full_name"]//input'
    username_input = '//ix-input[@formcontrolname="username"]//input'
    password_input = '//ix-input[@formcontrolname="password"]//input'
    confirm_password_input = '//ix-input[@formcontrolname="password_conf"]//input'
    select_shell = '//ix-combobox[@formcontrolname="shell"]//input'
    shell_option = '//mat-option[contains(.,"zsh")]'
    sudo_checkbox = '//mat-checkbox[contains(.,"Permit Sudo")]'


class button:
    add = '//button[contains(.,"Add")]'
    save = '//button[contains(*/text(),"Save")]'
    settings = '//button[contains(.,"Settings")]'
    Continue = '//button[contains(*/text(),"Continue")]'
    close = '//mat-icon[@id="ix-close-icon"]'


class checkbox:
    enable = '//ix-checkbox[@formcontrolname="enabled"]//mat-checkbox'
    confirm = '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]'


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    systemInfoCardTitle = '//span[text()="System Information"]'


class directoryServices:
    title = '//h1[text()="Directory Services"]'
    showButton = '//button[contains(*/text(),"Show")]'
    warningDialog = '//h1[text()="Warning"]'
    deleteAD02RealmButton = '//tr[contains(.,"AD02")]//button'
    deleteDialog = '//h1[text()="Delete"]'
    deleteConfirmCheckbox = '//mat-checkbox[@name="confirm_checkbox"]'
    deleteConfirmButton = '//button[@id="confirm-dialog__action-button"]'
    deleteADAccountButton = '//tr[contains(.,"AD_MACHINE_ACCOUNT")]//button'


class globalConfiguration:
    title = '//h3[text()="Edit Global Configuration"]'
    nameserver1_input = '//ix-input[contains(.,"Nameserver 1")]//input'
    nameserver2_input = '//ix-input[contains(.,"Nameserver 2")]//input'
    nameserver3_input = '//ix-input[contains(.,"Nameserver 3")]//input'
    ipv4_defaultGateway_input = '//ix-input[contains(.,"IPv4 Default Gateway")]//input'
    hostname_input = '//ix-input[contains(.,"Hostname")]//input'


class interface:
    title = '//h3[contains(text(),"Edit Interface")]'
    dhcp_checkbox = '//mat-checkbox[contains(.,"DHCP")]'
    add_allias = '//div[@class="label-container" and contains(.,"Aliases")]//button'
    ipAddress_input = '//ix-ip-input-with-netmask//input'
    netmask_select = '//ix-ip-input-with-netmask//mat-select'
    netmask_option = '//mat-option[contains(.,"24")]'


class login:
    user_input = '//input[@data-placeholder="Username"]'
    password_input = '//input[@data-placeholder="Password"]'
    signin_button = '//button[@name="signin_button"]'


class network:
    title = '//h1[contains(.,"Network")]'
    globalConfigurationTitle = '//h3[text()="Global Configuration"]'
    interface = '//mat-icon[@id="enp0s8"]'


class pool_manager:
    title = '//div[contains(.,"Pool Manager")]'
    name_input = '//input[@id="pool-manager__name-input-field"]'
    firstDisk_checkbox = '(//mat-checkbox[contains(@id,"pool-manager__disks-sd")])[1]'
    vdevAdd_button = '//button[@id="vdev__add-button"]'
    force_checkbox = '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]'
    warning_box_title = '//h1[contains(.,"Warning")]'
    create_button = '//button[@name="create-button"]'
    create_pool_button = '//button[@ix-auto="button__CREATE POOL"]'
    create_pool_popup = '//h1[contains(.,"Create Pool")]'


class popup:
    smbRestartTitle = '//h3[text()="Restart SMB Service"]'
    smbRestartButton = '//button[contains(*/text(),"Restart Service")]'
    pleaseWait = '//h6[contains(.,"Please wait")]'
    activeDirectory = '//h1[text()="Active Directory"]'


class progress:
    progressbar = '//mat-progress-bar'


class services:
    title = '//h1[text()="Services"]'
    smbtoggle = '//tr[contains(.,"SMB")]//mat-slide-toggle'


class sideMenu:
    """xpath for the menu on the left side"""
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    shares = '//mat-list-item[@ix-auto="option__Shares"]'
    systemSetting = '//mat-list-item[@ix-auto="option__System Settings"]'
    Services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]'
    credentials = '//mat-list-item[@ix-auto="option__Credentials"]'
    local_user = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]'
    directoryServices = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]'
    network = '//mat-list-item[@ix-auto="option__Network"]'
    storage = '//mat-list-item[@ix-auto="option__Storage"]'


class sharing:
    title = '//h1[text()="Sharing"]'
    smbPanelTitle = '//a[contains(text(),"Windows (SMB) Shares")]'
    smbAddButton = '//span[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]'
    smbServiceStatus = '//span[contains(.,"Windows (SMB) Shares")]//span[contains(text(),"RUNNING")]'

    def smbShareName(share_name):
        return f'//div[contains(text(),"{share_name}")]'


class smb:
    addTitle = '//h3[text()="Add SMB"]'
    description = '//ix-input[@formcontrolname="comment"]//input'
    path = '//ix-explorer[@formcontrolname="path"]//input'
    name = '//ix-input[@formcontrolname="name"]//input'


class storage:
    title = '//h1[contains(text(),"Storage Dashboard")]'
    create_pool_button = '//a[contains(.,"Create Pool")]'


class toolbar:
    ha_disabled = '//mat-icon[@data-mat-icon-name="ha_disabled"]'
    ha_enabled = '//mat-icon[@data-mat-icon-name="ha_enabled"]'


class users:
    title = '//h1[text()="Users"]'
    eric_user = '//tr[contains(.,"ericbsd")]/td'
    eric_edit_button = '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
