# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    run_cmd,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T1124.feature', 'Create an smb share with the tank ACL dataset')
def test_create_an_smb_share_with_the_tank_acl_dataset(driver):
    """Create an smb share with the tank ACL dataset."""
    # Disable the AD
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()
    """the Directory Services page should open, then click LDAP settings button."""
    # Verify the page is starting to load
    assert wait_on_element(driver, 5, '//h1[text()="Directory Services"]')
    time.sleep(1)
    # First we have to disable AD
    assert wait_on_element(driver, 5, '//mat-card//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//span[contains(text(),"Settings")]').click()
    # Verify the box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="Active Directory"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@ix-auto, "Enable (requires password")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[contains(@ix-auto, "Enable (requires password")]', 'class', 'mat-checkbox-checked')
    # The checkbox should be checked
    if checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[contains(@ix-auto, "Enable (requires password")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element_disappear(driver, 20, '//h1[text()="Start"]')
    assert wait_on_element(driver, 10, '//h3[text()="Active Directory and LDAP are disabled."]')


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['AD_Setup', 'AD_tank_Dataset'], scope='session')
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
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Sharing then Windows Shares(SMB)')
def you_should_be_on_the_dashboard_click_on_sharing_then_windows_sharessmb(driver):
    """you should be on the dashboard, click on Sharing then Windows Shares(SMB)."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()


@then('The Windows Shares(SMB) page should open, Click Add')
def the_windows_sharessmb_page_should_open_click_add(driver):
    """The Windows Shares(SMB) page should open, Click Add."""
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click()


@then(parsers.parse('Set Path to the ACL dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit'))
def set_path_to_the_acl_dataset_mnttanktank_acl_dataset_input_mytankshare_as_name_click_to_enable_input_my_tank_test_share_as_description_and_click_summit(driver, path, smbname, description):
    """Set Path to the ACL dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit."""
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    global smb_path
    smb_path = path
    """Set Path to the ACL dataset "/mnt/system/tank_acl_dataset"."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    if wait_on_element(driver, 3, '//h1[text()="Enable service"]'):
        assert wait_on_element(driver, 5, '//button[contains(.,"ENABLE SERVICE")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"ENABLE SERVICE")]').click()
        if wait_on_element(driver, 3, '//span[text()="SMB Service"]'):
            assert wait_on_element(driver, 5, '//button[span/text()="Close"]', 'clickable')
            driver.find_element_by_xpath('//button[span/text()="Close"]').click()


@then(parsers.parse('"{smbname}" should be added, Click on service and the Service page should open'))
def mysmbshare_should_be_added_click_on_service_and_the_service_page_should_open(driver, smbname):
    """"{smbname}" should be added, Click on service and the Service page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"mytankshare")]')
    time.sleep(2)


@then(parsers.parse('Send a file to the share with nas_ip/"{mytankshare}" and "{user}" and "{password}"'))
def send_a_file_to_the_share_with_nas_ipmysmbshare_and_administrator_and_abcd1234(driver, nas_ip, mytankshare, user, password):
    """Send a file to the share with nas_IP/"{mytankshare}" and "{user}" and "{password}"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{mytankshare} -W AD02 -U {user}%{password} -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then('Verify that the is on nas_ip with root and password')
def verify_that_the_is_on_nas_ip_with_root_and_password(driver, nas_ip, root_password):
    global results
    cmd = 'ls -la /mnt/tank/tank_acl_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']
