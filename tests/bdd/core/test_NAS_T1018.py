# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    run_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1018.feature', 'Create smb share for ericbsd verify only ericbsd can access it')
def test_create_smb_share_for_ericbsd_verify_only_ericbsd_can_access_it(driver):
    """Create smb share for ericbsd verify only ericbsd can access it."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on Sharing on the side menu and click Windows Shares')
def click_on_sharing_on_the_side_menu_and_click_windows_shares(driver):
    """click on Sharing on the side menu and click Windows Shares."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('when the Windows Shares page appears, click Add')
def when_the_windows_shares_page_appears_click_add(driver):
    """when the Windows Shares page appears, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Samba_ADD"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic")]')


@then(parsers.parse('set Path to the LDAP dataset at {dataset_path}'))
def set_path_to_the_ldap_dataset_at_mnttankwheel_dataset(driver, dataset_path):
    """set Path to the LDAP dataset at /mnt/tank/wheel_dataset."""
    global smb_path
    smb_path = dataset_path
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(dataset_path)


@then(parsers.parse('input {smb_name} as name, click to enable'))
def input_eric_share_as_name_click_to_enable(driver, smb_name):
    """input eric_share as name, click to enable."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smb_name)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')


@then(parsers.parse('input "{description}" as the description, click Summit'))
def input_test_ericbsd_smb_share_as_the_description_click_summit(driver, description):
    """input "test ericbsd SMB share" as the description, click Summit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//h1[contains(.,"Configure ACL")]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()


@then(parsers.parse('the {smb_name} should be added to the Windows Shares list'))
def the_eric_share_should_be_added_to_the_windows_shares_list(driver, smb_name):
    """the eric_share should be added to the Windows Shares list."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, f'//div[contains(.,"{smb_name}")]')


@then('click on Services on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on Services on the side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('the Services page should open')
def the_service_page_should_open(driver):
    """the Services page should open."""
    assert wait_on_element(driver, 7, '//services')


@then('if the SMB service is not started, start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """if the SMB service is not started, start the service."""
    assert wait_on_element(driver, 7, '//services')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SMB"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(2)


@then(parsers.parse('send a file to the share with NAS IP/{smb_name} and {user}%{password}'))
def send_a_file_to_the_share_with_nas_ip_eric_share_and_ericbsd_testing1(driver, nas_ip, smb_name, user, password):
    """send a file to the share with NAS IP/eric_share and ericbsd%testing1."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smb_name} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then('verify that the file is on the NAS')
def verify_that_the_file_is_on_the_nas(driver, nas_ip, root_password):
    """verify that the file is on the NAS."""
    results = post(nas_ip, 'filesystem/stat/', ('root', root_password), f'{smb_path}/testfile.txt')
    assert results.status_code == 200, results.text


@then(parsers.parse('send a file to the share should fail with NAS IP/{smb_name}and {user}%{password}'))
def send_a_file_to_the_share_should_fail_with_nas_ip_eric_share_and_footesting(driver, nas_ip, smb_name, user, password):
    """send a file to the share should fail with NAS IP/eric_share and foo%testing."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smb_name} -U {user}%{password} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


@then('verify that the file is not on the NAS')
def verify_that_the_file_is_not_on_the_nas(driver, nas_ip, root_password):
    """verify that the file is not on the NAS."""
    results = post(nas_ip, 'filesystem/stat/', ('root', root_password), f'{smb_path}/testfile2.txt')
    assert results.status_code == 422, results.text
    assert 'not found' in results.text, results.text
