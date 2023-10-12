# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
import reusableSeleniumCode as rsc
import xpaths
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
    pass


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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        rsc.scroll_To(driver, xpaths.sideMenu.root)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you are on the dashboard')
def you_are_on_the_dashboard(driver):
    """you are on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click on Storage on the side menu, click on Pools')
def click_on_storage_on_the_side_menu_click_on_pools(driver):
    """click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then('input dataset name home select SMB as Share Type and click save')
def input_dataset_name_home_select_smb_as_share_type_and_click_save(driver):
    """input dataset name home select SMB as Share Type and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('home')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_SMB"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    rsc.click_The_Summit_Button(driver)


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"home")]')


@then('click on Sharing on the side menu, click on Windows Shares')
def click_on_sharing_on_the_side_menu_click_on_windows_shares(driver):
    """click on Sharing on the side menu, click on Windows Shares."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('on the Windows Shares, click Add')
def on_the_windows_shares_click_add(driver):
    """on the Windows Shares, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Samba_ADD"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic")]')


@then('input home for the Name, input the home path for the SMB dataset')
def input_home_for_the_name_input_the_home_path_for_the_smb_dataset(driver):
    """input home for the Name, input the home path for the SMB dataset."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/tank/home')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('home')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys('home user Samba share')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()


@then('select No preset for Purpose, click ADVANCED OPTIONS')
def select_no_preset_for_purpose_click_advanced_options(driver):
    """select No preset for Purpose, click ADVANCED OPTIONS."""
    # To be done
    # ix-auto="select__Purpose"
    # ix-auto="option__Purpose_No presets"
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Purpose"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Purpose_No presets"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Purpose_No presets"]').click()
    # ix-auto="button__ADVANCED OPTIONS"
    if is_element_present(driver, xpaths.button.advanced_options):
        driver.find_element_by_xpath(xpaths.button.advanced_options).click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Use as Home Share"]')


@then('click to enable Use as home share, then click Save')
def click_to_enable_use_as_home_share_then_click_save(driver):
    """click to enable Use as home share, then click Save."""
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Use as Home Share"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Use as Home Share"]').click()
    rsc.click_The_Summit_Button(driver)


@then('the new share should be created without error')
def the_new_share_should_be_created_without_error(driver):
    """the new share should be created without error."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//a[contains(.,"Edit ACL")]')


@then('on the Edit ACL page, click on SELECT AN ACL PRESET')
def on_the_edit_acl_page_click_on_select_an_acl_preset(driver):
    """on the Edit ACL page, click on SELECT AN ACL PRESET."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"File Information")]')


@then('select HOME, click continue, set Group to builtin_users')
def select_home_click_continue_set_group_to_builtin_users(driver):
    """select HOME, click continue, set Group to builtin_users."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('wheel')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__wheel"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"home")]')


@then('on Windows Shares page verify the home share exist')
def on_windows_shares_page_verify_the_smbuser_share_exist(driver):
    """on Windows Shares page verify the home share exist."""
    assert wait_on_element(driver, 10, '//span[contains(.,"home")]')


@then('click on Accounts on the side menu, click on Users')
def click_on_accounts_on_the_side_menu_click_on_users(driver):
    """click on Accounts on the side menu, click on Users."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Users"]')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Accounts"]')
    class_attribute = element.get_attribute('class')
    assert 'open' in class_attribute, class_attribute
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Users"]').click()


@then('on the Users page click Add')
def on_the_users_page_click_add(driver):
    """on the Users page click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()


@then('input smbuser for the user name and input password')
def input_smbuser_for_the_user_name_and_input_password(driver):
    """input smbuser for the user name and input password."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Identification")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('SMB User')
    driver.find_element_by_xpath(xpaths.input.username).clear()
    driver.find_element_by_xpath(xpaths.input.username).send_keys('smbuser')
    driver.find_element_by_xpath(xpaths.input.password).clear()
    driver.find_element_by_xpath(xpaths.input.password).send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')


@then('verify that the Home Directory is auto-generated')
def verify_that_the_home_directory_is_autogenerated(driver):
    """verify that the Home Directory is auto-generated."""
    assert attribute_value_exist(driver, '//input[@ix-auto="input__home"]', 'value', '/mnt/tank/home/smbuser')


@then('click Submit, the user should be created without error')
def click_submit_the_user_should_be_created_without_error(driver):
    """click Submit, the user should be created without error."""
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__smbuser_Username"]')


@then('click on service on the side menu, the Service page should open')
def click_on_service_on_the_side_menu_the_service_page_should_open(driver):
    """click on service on the side menu, the Service page should open."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 5, '//li[contains(.,"Services")]')
    time.sleep(1)


@then('if the SMB service is not started, start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """if the SMB service is not started, start the service."""
    if is_element_present(driver, '//li[@aria-label="page 4"]'):
        assert wait_on_element(driver, 7, '//li[@aria-label="page 3"]', 'clickable')
        driver.find_element_by_xpath('//li[@aria-label="page 3"]').click()
    else:
        # Scroll to SMB service
        assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__S3_Running"]')
        element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__SMB_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    # This sleep is to make sure the system ready for smbclient
    time.sleep(2)


@then(parsers.parse('send a file to the share with ip/"{smbname}" and "{user}"%password'))
def send_a_file_to_the_share_with_ipsmbuser_and_smbuserpassword(driver, nas_ip, smbname, user):
    """send a file to the share with ip/"smbuser" and "smbuser"%password."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -W AD01 -U {user}%testing -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then(parsers.parse('verify that the file is on the with "{user}" and "{password}"'))
def verify_that_the_file_is_on_the_with_root_and_testing(driver, nas_ip, user, password):
    """verify that the file is on the with "root" and "testing"."""
    results = post(nas_ip, 'filesystem/stat/', (user, password), '/mnt/tank/home/smbuser/testfile.txt')
    assert results.status_code == 200, results.text
