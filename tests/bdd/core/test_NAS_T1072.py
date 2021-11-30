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
    run_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1072.feature', 'Validate smb share enumeration works upon reboot')
def test_validate_smb_share_enumeration_works_upon_reboot(driver):
    """Validate smb share enumeration works upon reboot."""
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
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('input {dataset} as Name, input "{comment}" as Comments'))
def input_documents_as_name_input_private_documents_share_as_comments(driver, dataset, comment):
    """input documents as Name, input "Private documents share" as Comments."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset)
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Comments"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Comments"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Comments"]').send_keys(comment)


@then('select SMB as Share Type and click the Submit button')
def select_smb_as_share_type_and_click_the_submit_button(driver):
    """select SMB as Share Type and click the Submit button."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Share Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"documents")]')


@then('click on the documents dataset 3 dots button, select Edit Permissions')
def click_on_the_documents_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the documents dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__documents"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__documents"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__documents_Edit Permissions"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__documents_Edit Permissions"]').click()


@then('on the Edit ACL page, set the user to ericbsd, click the apply checkbox')
def on_the_edit_acl_page_set_the_user_to_ericbsd_click_the_apply_checkbox(driver):
    """on the Edit ACL page, set the user to ericbsd, click the apply checkbox."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"File Information")]')
    time.sleep(0.5)
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
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('ericbsd')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__ericbsd"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"documents")]')


@then('after, click on Sharing on the side menu, click on Windows Shares')
def after_click_on_sharing_on_the_side_menu_click_on_windows_shares(driver):
    """after, click on Sharing on the side menu, click on Windows Shares."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Windows Shares (SMB)"]').click()


@then('on the Windows Shares, click Add')
def on_the_windows_shares_click_add(driver):
    """on the Windows Shares, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Samba")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__Samba_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Samba_ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic")]')


@then('input enumeration for the Name, input documents path for the SMB dataset')
def input_enumeration_for_the_name_input_documents_path_for_the_smb_dataset(driver):
    """input enumeration for the Name, input documents path for the SMB dataset."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('enumeration')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/tank/documents')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys('enumeration share')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()


@then('click Submit, the new share should be created without error')
def click_submit_the_new_share_should_be_created_without_error(driver):
    """click Submit, the new share should be created without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"enumeration")]')


@then('verify you can create a folder, rename a folder remove a folder')
def verify_you_can_create_a_folder_rename_a_folder_remove_a_folder(driver, nas_ip):
    """verify you can create a folder, rename a folder remove a folder."""
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "mkdir testfolder"')
    assert results['result'], results['output']
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "rename testfolder testfolder2"')
    assert results['result'], results['output']
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "rmdir testfolder2"')
    assert results['result'], results['output']


@then('verify you can create a file, rename a file, remove a file')
def verify_you_can_create_a_file_rename_a_file_remove_a_file(driver, nas_ip):
    """verify you can create a file, rename a file, remove a file."""
    run_cmd('touch testfile')
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "put testfile"')
    assert results['result'], results['output']
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "rename testfile testfile2"')
    assert results['result'], results['output']
    results = run_cmd(f'smbclient //{nas_ip}/enumeration -U ericbsd%testing1234 -c "rm testfile2"')
    assert results['result'], results['output']
    run_cmd('rm testfile')


@then('click the power button and click Restart to reboot TrueNAS')
def click_the_power_button_and_click_restart_to_reboot_truenas(driver):
    """click the power button and click Restart to reboot TrueNAS."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__power"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="option__Restart"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="option__Restart"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Restart")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__RESTART"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__RESTART"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('Wait for the Login to comeback')
def wait_for_the_login_to_comeback(driver):
    """Wait for the Login to comeback."""
    assert wait_on_element(driver, 300, '//input[@placeholder="Username"]', 'clickable')
    time.sleep(5)
    assert wait_on_element(driver, 20, '//input[@placeholder="Password"]', 'clickable')
    assert wait_on_element(driver, 7, '//input[@placeholder="Username"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()
