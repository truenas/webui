# coding=utf-8
"""CORE feature tests."""

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


@scenario('features/NAS-T1042.feature', 'Verify SMB Guest Account Access Works')
def test_core_verify_smb_guest_account_access_works(driver):
    """CORE: Verify SMB Guest Account Access Works."""
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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
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
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Dataset"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then('input guest for Name, select SMB as Share Type, and click Submit')
def input_guest_for_name_select_smb_as_share_type_and_click_submit(driver):
    """input guest for Name, select SMB as Share Type, and click Submit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('guest')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_SMB"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"guest")]')


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


@then('input guest_share for the Name, input the guest path for the SMB dataset')
def input_guest_share_for_the_name_input_the_guest_path_for_the_smb_dataset(driver):
    """input guest_share for the Name, input the guest path for the SMB dataset."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/tank/guest')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('guest_share')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys('Guest Samba share')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()


@then('click ADVANCED OPTIONS and check the Allow Guest Access box')
def click_advanced_options_and_check_the_allow_guest_access_box(driver):
    """click ADVANCED OPTIONS and check the Allow Guest Access box."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Guest Access"]')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Guest Access"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Guest Access"]').click()


@then('click Submit, the new share should be created without error')
def click_submit_the_new_share_should_be_created_without_error(driver):
    """click Submit, the new share should be created without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"guest_share")]')


@then('click on the guest dataset 3 dots button, select Edit Permissions')
def click_on_the_guest_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the guest dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__guest"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__guest"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__guest_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__guest_Edit Permissions"]').click()


@then('on the Edit ACL page, set the user to nobody and the Group to nogroup')
def on_the_edit_acl_page_set_the_user_to_nobody_and_the_group_to_nogroup(driver):
    """on the Edit ACL page, set the user to nobody and the Group to nogroup."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"File Information")]')
    time.sleep(1)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SELECT AN ACL PRESET"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SELECT AN ACL PRESET"]').click()
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Default ACL Options"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Default ACL Options_OPEN"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Default ACL Options_OPEN"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('nobody')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__nobody"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('nogroup')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__nogroup"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"guest")]')


@then(parsers.parse('try to send a file to {smbname} with {user}%{password}'))
def try_to_send_a_file_to_guest_share_with_baduserbadpassword(driver, nas_ip, smbname, user, password):
    """try to send a file to "guest_share" with "baduser"%"badpassword"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then(parsers.parse('verify that the file is on the NAS with {user} and {password}'))
def verify_that_the_file_is_on_the_nas_with_root_and_testing(driver, nas_ip, user, password):
    """verify that the file is on the NAS with root and testing."""
    results = post(nas_ip, 'filesystem/stat/', (user, password), '/mnt/tank/guest/testfile.txt')
    assert results.status_code == 200, results.text
