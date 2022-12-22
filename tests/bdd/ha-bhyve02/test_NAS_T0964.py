# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""

import time
import xpaths
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    wait_for_attribute_value,
    run_cmd,
    post
)
from pytest_dependency import depends


@scenario('features/NAS-T964.feature', 'Create an SMB share with the Active Directory dataset')
def test_create_an_smb_share_with_the_active_directory_dataset(driver):
    """Create an SMB share with the Active Directory dataset."""
    # stop AD after the test is completed.
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directoryServices)
    driver.find_element_by_xpath(xpaths.sideMenu.directoryServices).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 7, xpaths.directoryServices.title)

    assert wait_on_element(driver, 5, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()

    assert wait_on_element(driver, 5, xpaths.activeDirectory.title)
    assert wait_on_element(driver, 7, xpaths.activeDirectory.enableCheckbox, 'clickable')
    driver.find_element_by_xpath(xpaths.activeDirectory.enableCheckbox).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.activeDirectory)

    # Clean Kerberos
    assert wait_on_element(driver, 7, xpaths.directoryServices.showButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.showButton).click()

    assert wait_on_element(driver, 5, xpaths.directoryServices.warningDialog)
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()

    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteAD02RealmButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteAD02RealmButton).click()

    assert wait_on_element(driver, 5, xpaths.directoryServices.deleteDialog)
    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteConfirmCheckbox, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteConfirmCheckbox).click()
    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteConfirmButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteConfirmButton).click()

    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteADAccountButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteADAccountButton).click()

    assert wait_on_element(driver, 5, xpaths.directoryServices.deleteDialog)
    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteConfirmCheckbox, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteConfirmCheckbox).click()
    assert wait_on_element(driver, 7, xpaths.directoryServices.deleteConfirmButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.deleteConfirmButton).click()


@given(parsers.parse('the browser is open, navigate to "{host}"'))
def the_browser_is_open_navigate_to_host(driver, host, request):
    """the browser is open, navigate to "{host}"."""
    depends(request, ['Active_Directory'], scope='session')
    if host not in driver.current_url:
        driver.get(f"http://{host}/ui/sessions/signin")
        assert wait_on_element(driver, 10, xpaths.login.user_input)


@when(parsers.parse('the login page appears, enter "{user}" and "{password}"'))
def the_login_page_appears_enter_root_and_password(driver, user, password):
    """the login page appears, enter "root" and "password"."""
    global root_password
    root_password = password
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@then('on the dashboard, click on Shares on the left sidebar')
def on_the_dashboard_click_on_shares_on_the_left_sidebar(driver):
    """on the dashboard, click on Shares on the left sidebar."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, xpaths.sideMenu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()


@then('on the Sharing page, click the Add button on Windows (SMB) Shares')
def on_the_sharing_page_click_the_add_button_on_windows_smb_shares(driver):
    """on the Sharing page, click the Add button on Windows (SMB) Shares."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smbPanelTitle)
    assert wait_on_element(driver, 5, xpaths.sharing.smbAddButton, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smbAddButton).click()


@then(parsers.parse('on the Add SMB slide box, set the Path to "{dataset_path}"'))
def on_the_add_smb_slide_box_set_the_path_to_mntdozermy_ad_dataset(driver, dataset_path):
    """on the Add SMB slide box, set the Path to "/mnt/dozer/my_ad_dataset"."""
    global dataset
    dataset = dataset_path
    assert wait_on_element(driver, 7, xpaths.smb.addTitle)
    assert wait_on_element(driver, 5, xpaths.smb.description_input)
    assert wait_on_element(driver, 5, xpaths.smb.path_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_input).send_keys(dataset_path)


@then(parsers.parse('input "{share_name}" as name, then click to enable'))
def input_myadsmbshare_as_name_then_click_to_enable(driver, share_name):
    """input "myadsmbshare" as name, then click to enable."""
    assert wait_on_element(driver, 5, xpaths.smb.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_input).click()
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys(share_name)
    assert wait_on_element(driver, 5, xpaths.checkbox.enabled, 'clickable')
    if not attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-checkbox-checked'):
        driver.find_element_by_xpath(xpaths.checkbox.enable).click()


@then(parsers.parse('input "{description}" as the description, click Save'))
def input_my_active_directory_smb_share_as_the_description_click_save(driver, description):
    """input "My Active Directory SMB share" as the description, click Save."""
    driver.find_element_by_xpath(xpaths.smb.description_input).send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('if Restart SMB Service box appears, click Restart Service')
def if_restart_smb_service_box_appears_click_restart_service(driver):
    """if Restart SMB Service box appears, click Restart Service."""
    assert wait_on_element(driver, 7, xpaths.popup.smbRestartTitle)
    assert wait_on_element(driver, 5, xpaths.popup.smbRestartButton, 'clickable')
    driver.find_element_by_xpath(xpaths.popup.smbRestartButton).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('"{share_name}" should appear on the Sharing page under SMB'))
def myadsmbshare_should_appear_on_the_sharing_page_under_smb(driver, share_name):
    """"myadsmbshare" should appear on the Sharing page under SMB."""
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smbShareName(share_name))


@then('verify the SMB service status is RUNNING under Windows (SMB) Shares')
def verify_the_smb_service_status_is_running_under_windows_smb_shares(driver):
    """verify the SMB service status is RUNNING under Windows (SMB) Shares."""
    assert wait_on_element(driver, 5, xpaths.sharing.smbServiceStatus)


@then('click on System Settings on the left sidebar, and click Services')
def click_on_system_settings_on_the_left_sidebar_and_click_services(driver):
    """click on System Settings on the left sidebar, and click Services."""
    assert wait_on_element(driver, 5, xpaths.sideMenu.systemSetting, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.systemSetting).click()
    assert wait_on_element(driver, 5, xpaths.sideMenu.Services, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.Services).click()


@then('on the Service page, verify SMB service is started')
def on_the_Service_page_verify_smb_service_is_started(driver):
    """on the Service page, verify SMB service is started."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.smbtoggle, 'clickable')
    assert wait_for_attribute_value(driver, 20, xpaths.services.smbtoggle, 'class', 'mat-checked')


@then(parsers.parse('send a file to the share with "{host}"/"{share_name}" and "{ad_user}"%"{ad_password}"'))
def send_a_file_to_the_share(driver, host, share_name, ad_user, ad_password):
    """send a file to the share with "{host}"/"{share}" and "{ad_user}"%"{ad_password}"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{host}/{share_name} -W AD02 -U {ad_user}%{ad_password} -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']
    time.sleep(1)


@then(parsers.parse('verify that the file is on "{host}"'))
def verify_that_the_file_is_on_host(driver, host):
    """verify that the file is on "host"."""
    file = f'{dataset}/testfile.txt'
    results = post(host, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 200, results.text
