
class login:
    user_input = '//input[@data-placeholder="Username"]'
    password_input = '//input[@data-placeholder="Password"]'
    signin_button = '//button[@name="signin_button"]'


class sideMenu:
    """xpath for the menu on the left side"""
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    shares = '//mat-list-item[@ix-auto="option__Shares"]'
    systemSetting = '//mat-list-item[@ix-auto="option__System Settings"]'
    Services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]'


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    systemInfoCardTitle = '//span[text()="System Information"]'


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


class checkbox:
    enable = '//ix-checkbox[@formcontrolname="enabled"]//mat-checkbox'


class button:
    save = '//button[contains(*/text(),"Save")]'


class progress:
    progressbar = '//mat-progress-bar'


class popup:
    smbRestartTitle = '//h3[text()="Restart SMB Service"]'
    smbRestartButton = '//button[contains(*/text(),"Restart Service")]'


class services:
    title = '//h1[text()="Services"]'
    smbtoggle = '//tr[contains(.,"SMB")]//mat-slide-toggle'
