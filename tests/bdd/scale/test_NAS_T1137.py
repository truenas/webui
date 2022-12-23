# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    run_cmd,
    ssh_cmd,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers,
)
from pytest_dependency import depends


@scenario('features/NAS-T1137.feature', 'Create smb share for ericbsd verify only ericbsd can access it')
def test_create_smb_share_for_ericbsd_verify_only_ericbsd_can_access_it():
    """Create smb share for ericbsd verify only ericbsd can access it."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['ericbsd_dataset'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Shares on the side menu')
def you_should_be_on_the_dashboard_click_on_shares_on_the_side_menu(driver):
    """you should be on the dashboard, click on Shares on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')


@then('The Windows Shares(SMB) page should open, Click Add')
def the_windows_sharessmb_page_should_open_click_add(driver):
    """The Windows Shares(SMB) page should open, Click Add."""
    assert wait_on_element(driver, 7, xpaths.sharing.smbAddButton, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smbAddButton).click()
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Basic")]')


@then(parsers.parse('Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit'))
def set_path_to_the_ldap_dataset_mnttankericbsd_dataset_input_eric_share_as_name_click_to_enable_input_test_eric_smb_share_as_description_and_click_summit(driver, path, smbname, description):
    """Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit."""
    time.sleep(1)
    global smb_path
    smb_path = path
    assert wait_on_element(driver, 5, xpaths.smb.path_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_input).send_keys(path)
    assert wait_on_element(driver, 5, xpaths.smb.name_input)
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath(xpaths.checkbox.enabled).click()
    assert attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, xpaths.smb.description_input)
    driver.find_element_by_xpath(xpaths.smb.description_input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_input).send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    if wait_on_element(driver, 3, '//h1[text()="Enable service"]'):
        assert wait_on_element(driver, 5, '//button[contains(.,"ENABLE SERVICE")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"ENABLE SERVICE")]').click()
        if wait_on_element(driver, 3, '//span[text()="SMB Service"]'):
            assert wait_on_element(driver, 5, '//button[span/text()="Close"]', 'clickable')
            driver.find_element_by_xpath('//button[span/text()="Close"]').click()


@then(parsers.parse('{sharename} should be added, start service if its not running'))
def sharename_should_be_added_start_service_if_its_not_running(driver, sharename):
    """{sharename} should be added, start service if its not running."""
    assert wait_on_element(driver, 5, '//div[contains(.,"SMB")]')
    assert wait_on_element(driver, 5, f'//div[contains(.,"{sharename}")]')
    if not is_element_present(driver, '//mat-card[contains(.,"Windows (SMB) Shares")]//span[contains(.,"RUNNING")]'):
        assert wait_on_element(driver, 10, '//mat-card[contains(.,"Windows (SMB) Shares")]//mat-icon[text()="more_vert"]', 'clickable')
        driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//mat-icon[text()="more_vert"]').click()
        assert wait_on_element(driver, 10, '//button[normalize-space(text())="Turn On Service"]', 'clickable')
        driver.find_element_by_xpath('//button[normalize-space(text())="Turn On Service"]').click()
        assert wait_on_element(driver, 20, '//mat-card[contains(.,"Windows (SMB) Shares")]//span[contains(.,"RUNNING")]')
    # This sleep is to make sure that the NAS VM is ready for the step
    time.sleep(2)


@then(parsers.parse('Send a file to the share with nas_IP/"{smbname}" and "{user}" and "{password}"'))
def send_a_file_to_the_share_with_nas_iperic_share_and_ericbsd_and_testing1234(driver, nas_ip, smbname, user, password):
    """Send a file to the share with nas_IP/"{smbname}" and "{user}" and "testing1234"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then('Verify that the is on nas_ip with root and password')
def verify_that_the_is_on_nas_ip_with_root_and_password(driver, root_password, nas_ip):
    """Verify that the is on nas_ip with root and password."""
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']


@then(parsers.parse('send a file to the share should fail with NAS IP/"{smbname}" and {user2}%{password2}'))
def send_a_file_to_the_share_should_fail_with_nas_iperic_share_and_footesting(driver, smbname, user2, password2, nas_ip):
    """send a file to the share should fail with NAS IP/"{smbname}" and {user2}{password2}."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user2}%{password2} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


@then(parsers.parse('verify that the file is not on the NAS'))
def verify_that_the_file_is_not_on_the_nas(driver, nas_ip, root_password):
    """verify that the file is not on the NAS."""
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile2' not in results['output'], results['output']
