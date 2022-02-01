# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
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


@scenario('features/NAS-T1013.feature', 'Create an smb share with the LDAP dataset and verify the connection')
def test_create_an_smb_share_with_the_ldap_dataset_and_verify_the_connection(driver):
    """Create an smb share with the LDAP dataset and verify the connection."""


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
    else:
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


@then(parsers.parse('set Path to the LDAP dataset at {path}'))
def set_path_to_the_ldap_dataset_at_mntdozermy_ldap_dataset(driver, path):
    """set Path to the LDAP dataset at /mnt/dozer/my_ldap_dataset."""
    global smb_path
    smb_path = path
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)


@then(parsers.parse('input {smbname} as name, click to enable'))
def input_ldapsmbshare_as_name_click_to_enable(driver, smbname):
    """input ldapsmbshare as name, click to enable."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')


@then(parsers.parse('input "{description}" as the description, click Summit'))
def input_my_ldap_smb_test_share_as_the_description_click_summit(driver, description):
    """input "My LDAP smb test share" as the description, click Summit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 7, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//h1[contains(.,"Configure ACL")]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()


@then(parsers.parse('the {smbname} should be added to the Windows Shares list'))
def the_ldapsmbshare_should_be_added_to_the_windows_shares_list(driver, smbname):
    """the ldapsmbshare should be added to the Windows Shares list."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, f'//div[contains(.,"{smbname}")]')


@then('click on service on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on service on the side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('the Service page should open')
def the_service_page_should_open(driver):
    """the Service page should open."""
    assert wait_on_element(driver, 7, '//services')


@then('if the SMB service is not started, start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """if the SMB service is not started, start the service."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SMB"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(5)


@then(parsers.parse('send a file to the share with ip/{smbname} and {ldap_user}%{ldap_password}'))
def send_a_file_to_the_share_with_ip_ldapsmbshare_and_ldap_user_ldap_password(driver, nas_ip, smbname, ldap_user, ldap_password):
    """send a file to the share with ip/ldapsmbshare and ldap_user%ldap_password."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -W AD01 -U {ldap_user}%{ldap_password} -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


@then('verify that the file is on the NAS dataset')
def verify_that_the_file_is_on_the_nas_dataset(driver, nas_ip, root_password):
    """verify that the file is on the NAS dataset."""
    results = post(nas_ip, 'filesystem/stat/', ('root', root_password), f'{smb_path}/testfile.txt')
    assert results.status_code == 200, results.text


@then('click on Directory Services then LDAP')
def click_on_directory_services_then_ldap(driver):
    """click on Directory Services then LDAP."""
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__LDAP"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__LDAP"]').click()


@then('click the Enable checkbox and click SAVE')
def click_the_enable_checkbox_and_click_save(driver):
    """click the Enable checkbox and click SAVE."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Server Credentials")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Settings saved.")]')
