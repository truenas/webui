# coding=utf-8
"""SCALE UI: feature tests."""

import time
# from selenium.webdriver.common.keys import Keys
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


@scenario('features/NAS-T1133.feature', 'Create a wheel group smb share and verify only wheel group can send file')
def test_create_a_wheel_group_smb_share_and_verify_only_wheel_group_can_send_file():
    """Create a wheel group smb share and verify only wheel group can send file."""
    pass


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('add the user to group root for later tests')
def add_the_user_to_group_root_for_later_tests(driver):
    """add the user to group root for later tests."""
    pass


@then('The Windows Shares(SMB) page should open, Click Add')
def the_windows_sharessmb_page_should_open_click_add(driver):
    """The Windows Shares(SMB) page should open, Click Add."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()


@then(parsers.parse('Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit'))
def set_path_to_the_ldap_dataset_mnttankwheel_dataset_input_wheelsmbshare_as_name_click_to_enable_input_test_wheel_smb_share_as_description_and_click_summit(driver, path, smbname, description):
    """Set Path to the LDAP dataset {path}, Input {smbname} as name, Click to enable, Input {description} as description, and Click Summit."""
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    global smb_path
    smb_path = path
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
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    if is_element_present(driver, '//button[@ix-auto="button__ENABLE SERVICE"]'):
        wait_on_element(driver, 5, '//button[@ix-auto="button__ENABLE SERVICE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__ENABLE SERVICE"]').click()
    if is_element_present(driver, '//button[@ix-auto="button__CLOSE"]'):
        wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('smb should be added')
def smb_should_be_added(driver):
    """"smbname should be added."""
    assert wait_on_element(driver, 5, '//mat-panel-title//h5//a[contains(.,"(SMB)")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"wheelsmbshare")]')
    # Make sure SMB is started
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 7, '//services')
    assert wait_on_element(driver, 5, '//td[contains(text(),"Dynamic DNS")]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//td[contains(text(),"Dynamic DNS")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SMB")]//mat-checkbox')
    value_exist = attribute_value_exist(driver, '//tr[contains(.,"SMB")]//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SMB")]//mat-checkbox').click()
    assert wait_on_element(driver, 5, '//tr[contains(.,"SMB")]//mat-slide-toggle/label', 'clickable')
    value_exist = attribute_value_exist(driver, '//tr[contains(.,"SMB")]//mat-slide-toggle', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SMB")]//mat-slide-toggle/label').click()
    # This sleep is to make sure that the NAS VM is ready for the step
    time.sleep(2)


@then(parsers.parse('Send a file to the share with nas_ip/"{wheelshare}" and "{user}" and "{password}"'))
def send_a_file_to_the_share_with_nas_ipwheelshare_and_administrator_and_abcd1234(driver, nas_ip, wheelshare, user, password):
    """Send a file to the share with nas_IP/"{wheelshare}" and "{user}" and "{password}"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{wheelshare} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


@then('Verify that the is on nas_ip with root and password')
def verify_that_the_is_on_nas_ip_with_root_and_password(driver, root_password, nas_ip):
    """Verify that the is on nas_ip with root and password."""
    global results
    cmd = 'ls -la /mnt/tank/wheel_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']


@then(parsers.parse('send a file to the share should fail with NAS IP/{wheelname} and {user}%{password}'))
def send_a_file_to_the_share_should_fail_with_nas_ipwheelshare_and_footesting(driver, nas_ip, wheelshare, user, password):
    """send a file to the share should fail with NAS IP/"{wheelshare}" and {user}%{password}."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{wheelshare} -U {user}%{password} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


@then('verify that the file is not on the NAS')
def verify_that_the_file_is_not_on_the_nas(driver, root_password, nas_ip):
    """verify that the file is not on the NAS."""
    global results
    cmd = 'ls -la /mnt/tank/wheel_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile2' not in results['output'], results['output']
