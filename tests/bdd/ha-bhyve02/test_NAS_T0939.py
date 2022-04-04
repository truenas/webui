# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import time
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


@scenario('features/NAS-T939.feature', 'Create a smb share the ACL dataset')
def test_create_a_smb_share_the_acl_dataset(driver):
    """Create a smb share the ACL dataset."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "user" and "password"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')


@then('Click on Sharing then Windows Shares(SMB)')
def click_on_sharing_then_windows_sharessmb(driver):
    """Click on Sharing then Windows Shares(SMB)."""
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('The Windows Shares(SMB) page should open')
def the_windows_sharessmb_page_should_open(driver):
    """The Windows Shares(SMB) page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Samba")]')


@then('Click Add')
def click_add(driver):
    """Click Add."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Samba_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Basic")]')


@then(parsers.parse('Set Path to the ACL dataset "{path}"'))
def set_path_to_the_acl_dataset_mntdozermyacldataset(driver, path):
    global smb_path
    smb_path = path
    """Set Path to the ACL dataset "/mnt/dozer/my_acl_dataset"."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)


@then(parsers.parse('Input "{smbname}" as name, Click to enable'))
def input_mysmbshare_as_name_click_to_enable(driver, smbname):
    """Input "mysmbshare" as name, Click to enable."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')


@then(parsers.parse('Input "{description}" as description'))
def input_my_smb_test_share_as_description(driver, description):
    """Input "My smb test share" as description."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('Click Summit')
def click_summit(driver):
    """Click Summit."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then(parsers.parse('The "{smbname}" should be added'))
def the_mysmbshare_should_be_added(driver, smbname):
    """The "mysmbshare" should be added."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Samba")]', 'clickable')
    assert wait_on_element(driver, 5, f'//div[contains(.,"{smbname}")]')


@then('Click on service')
def click_on_service(driver):
    """Click on service."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('The Service page should open')
def the_service_page_should_open(driver):
    """The Service page should open."""
    assert wait_on_element(driver, 5, '//services')


@then('If the SMB service is not started start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """If the SMB service is not started start the service."""
    assert wait_on_element(driver, 5, '//services')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__S3_Actions"]', 'clickable')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SMB"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(2)


@then('Click on SMB Start Automatically checkbox')
def click_on_smb_start_automatically_checkbox(driver):
    """Click on SMB Start Automatically checkbox."""
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__SMB_Start Automatically"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__SMB_Start Automatically"]').click()


@then(parsers.parse('Send a file to the share with "{nas_url}"/"{smbname}" and "{user}"%"{password}"'))
def send_a_file_to_the_share_with_nas_url_smbname_and_user_password(driver, nas_url, smbname, user, password):
    """Send a file the share with "nas_url"/"smbname" and "user"%"password"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_url}/{smbname} -W AD02 -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then(parsers.parse('Verify that the is on "{nas_url}" with "{user}" and "{password}"'))
def Verify_that_the_is_on_url_with_root_and_password(driver, nas_url, user, password):
    """Verify that the is on "{nas_url}" with "{user}" and "{password}"."""
    results = post(nas_url, 'filesystem/stat/', (user, password), f'{smb_path}/testfile.txt')
    assert results.status_code == 200, results.text


@then('Click on Directory Services then Active Directory')
def click_on_directory_services_then_active_directory(driver):
    """Click on Directory Services then Active Directory."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Active Directory"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Active Directory"]').click()


@then('Click the Enable checkbox and click SAVE')
def click_the_enable_checkbox_and_click_save(driver):
    """Click the Enable checkbox and click SAVE."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Domain Credentials")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Settings saved.")]')
