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


@scenario('features/NAS-T1041.feature', 'Verify home directories work for SMB share')
def test_verify_home_directories_work_for_smb_share(driver):
    """Verify home directories work for SMB share."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 0.5, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you are on the dashboard')
def you_are_on_the_dashboard(driver):
    """you are on the dashboard."""
    assert wait_on_element(driver, 1, 7, '//a[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 0.5, 7, '//span[contains(.,"System Information")]')


@then('click on the Storage on the side menu, click on Pools')
def click_on_the_storage_on_the_side_menu_click_on_pools(driver):
    """click on the Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 0.5, 7, '//div[contains(.,"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 1, 7, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="action__tank_Add Dataset"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"Name and Options")]')


@then('input dataset name smbuser select SMB as Share Type and click save')
def input_dataset_name_smbuser_select_smb_as_share_type_and_click_save(driver):
    """input dataset name smbuser select SMB as Share Type and click save."""
    assert wait_on_element(driver, 0.5, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('smbuser')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-option[@ix-auto="option__Share Type_SMB"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')


@then('the dataset should be created without error')
def the_smbuser_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element(driver, 0.5, 10, '//span[contains(.,"smbuser")]')


@then('click on the Accounts on the side menu, click on Users')
def click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """click on the Accounts on the side menu, click on Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Users"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('on the Users page Click Add and input smbuser for the user name')
def on_the_users_page_click_add_and_input_smbuser_for_the_user_name(driver):
    """on the Users page Click Add and input smbuser for the user name."""
    assert wait_on_element(driver, 0.5, 7, '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()
    assert wait_on_element(driver, 1, 7, '//h4[contains(.,"Identification")]')
    assert wait_on_element(driver, 1, 7, '//input[@ix-auto="input__Full Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('SMB User')
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('smbuser')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')


@then('uncheck New Primary Group, then select Wheel as Primary Group')
def uncheck_new_primary_group_then_select_wheel_as_primary_group(driver):
    """uncheck New Primary Group, then select Wheel as Primary Group."""
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__New Primary Group"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__New Primary Group"]').click()
    assert wait_on_element(driver, 1, 7, '//mat-select[@ix-auto="select__Primary Group" ]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Primary Group" ]').click()
    assert wait_on_element(driver, 1, 7, '//mat-option[@ix-auto="option__Primary Group_wheel"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Primary Group_wheel"]').click()


@then('set the smbuser dataset as your Home Directory, then click Save')
def set_the_smbuser_dataset_as_your_home_directory_click_save(driver):
    """set the smbuser dataset as your Home Directory, then click Save."""
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__home"]').send_keys('/mnt/tank/smbuser')
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')


@then('the user should be created without error')
def the_user_should_be_created_without_error(driver):
    """the user should be created without error."""
    assert wait_on_element(driver, 0.5, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 0.5, 7, '//div[@ix-auto="value__smbuser_Username"]')


@then('click on the smbuser dataset three dots button, select Edit Permissions')
def click_on_the_smbuser_dataset_three_dots_button_select_edit_permissions(driver):
    """click on the smbuser dataset three dots button, select Edit Permissions."""
    assert wait_on_element(driver, 1, 7, '//mat-icon[@ix-auto="options__smbuser"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__smbuser"]').click()
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="action__smbuser_Edit Permissions"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__smbuser_Edit Permissions"]').click()


@then('when the page Permissions open, click on Use ACL Manage')
def when_the_page_permissions_open_click_on_use_acl_manage(driver):
    """when the page Permissions open, click on Use ACL Manage."""
    if wait_on_element(driver, 0.5, 3, '//h4[contains(.,"Dataset Path")]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__USE ACL MANAGER"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h4[contains(.,"File Information")]')


@then('when the Edit ACL page open, set User to smbuser and Group to wheel, then click Save')
def when_the_edit_acl_page_open_set_user_to_smbuser_and_group_to_wheel_then_click_save(driver):
    """when the Edit ACL page open, set User to smbuser and Group to wheel, then click Save."""
    assert wait_on_element(driver, 0.5, 7, '//input[@placeholder="User"]')
    driver.find_element_by_xpath('//input[@placeholder="User"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="User"]').send_keys('smbuser')
    assert wait_on_element(driver, 1, 7, '//mat-option[@ix-auto="option__smbuser"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 0.5, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 0.5, 7, '//input[@placeholder="Group"]')
    driver.find_element_by_xpath('//input[@placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Group"]').send_keys('wheel')
    assert wait_on_element(driver, 1, 7, '//mat-option[@ix-auto="option__wheel"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 0.5, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')


@then('the permissions should be changed without error')
def the_permissions_should_be_changed_without_error(driver):
    """the permissions should be changed without error."""
    assert wait_on_element(driver, 1, 7, '//mat-panel-title[contains(.,"tank")]')
    assert wait_on_element(driver, 0.5, 10, '//span[contains(.,"smbuser")]')


@then('click on the Sharing on the side menu, click on Windows Shares')
def click_on_the_sharing_on_the_side_menu_click_on_windows_shares(driver):
    """click on the Sharing on the side menu, click on Windows Shares."""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Sharing"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('on the Windows Shares, click Add')
def on_the_windows_shares_click_add(driver):
    """on the Windows Shares, click Add."""
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__Samba_ADD"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 1, 7, '//h4[contains(.,"Basic")]')


@then('set Path to the SMB dataset and click to enable Use as home share, then click Save')
def set_path_to_the_smb_dataset_and_click_to_enable_use_as_home_share_then_click_save(driver):
    """set Path to the SMB dataset and click to enable Use as home share, then click Save."""
    assert wait_on_element(driver, 0.5, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/tmp/tank/smbuser')
    assert wait_on_element(driver, 0.5, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('smbuser')
    assert wait_on_element(driver, 0.5, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys('smbuser home Samba share')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    # To be done
    # ix-auto="select__Purpose"
    # ix-auto="option__Purpose_No presets"
    # ix-auto="button__ADVANCED OPTIONS"
    checkbox_checked = attribute_value_exist(driver, '//ix-auto="checkbox__Use as Home Share"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//ix-auto="checkbox__Use as Home Share"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the new share should be created without error')
def the_new_share_should_be_created_without_error(driver):
    """the new share should be created without error."""
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"smbuser")]')


@then('click on service on the side menu, the Service page should open')
def click_on_service_on_the_side_menu_the_service_page_should_open(driver):
    """click on service on the side menu, the Service page should open."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 1, 7, '//services')


@then('if the SMB service is not started, start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """if the SMB service is not started, start the service."""
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SMB"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(2)


@then(parsers.parse('send a file to the share with ip/"{smbuser}" and "{user}"%password'))
def send_a_file_to_the_share_with_ipsmbuser_and_smbuserpassword(driver, nas_ip, smbname, user):
    """send a file to the share with ip/"smbuser" and "smbuser"%password."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -W AD01 -U {user}%testing -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then(parsers.parse('verify that the file is on the with "{user}" and "{password}"'))
def verify_that_the_file_is_on_the_with_root_and_testing(driver, nas_ip, user, password):
    """verify that the file is on the with "root" and "testing"."""
    results = post(nas_ip, 'filesystem/stat/', (user, password), '/tmp/tank/smbuser/testfile.txt')
    assert results.status_code == 200, results.text
