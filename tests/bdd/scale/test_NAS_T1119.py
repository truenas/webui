# coding=utf-8
"""SCALE UI: feature tests."""

import time
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1119.feature', 'Create an Active Directory dataset on the tank pool')
def test_create_an_active_directory_dataset_on_the_tank_pool():
    """Create an Active Directory dataset on the tank pool."""


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
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click Storage on the left sidebar.')
def on_the_dashboard_click_storage_on_the_left_sidebar(driver):
    """on the Dashboard, click Storagek on the left sidebar.."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('open the Storage page and click on the system 3 dots button, select Add Dataset.')
def open_the_storage_page_and_click_on_the_system_3_dots_button_select_add_dataset(driver):
    """open the Storage page and click on the system 3 dots button, select Add Dataset.."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()    


@then(parsers.parse('on the Add Dataset page, input the dataset name "{dataset_name}".'))
def on_the_add_dataset_page_input_the_dataset_name_dataset_name(driver, dataset_name):
    """on the Add Dataset page, input the dataset name "{dataset_name}".."""
    time.sleep(1)
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('click Summit the "{dataset_name}" data should be created.'))
def click_summit_the_dataset_name_data_should_be_created(driver, dataset_name):
    """click Summit the "{dataset_name}" data should be created.."""
    time.sleep(4)
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select Edit Permissions.'))
def click_on_the_dataset_name_3_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the "{dataset_name}" 3 dots button, select Edit Permissions.."""
    driver.find_element_by_xpath('//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()


@then('The Edit ACL page should open, select OPEN for Default ACL Option, select "AD01\Administrator" for Group name, check the Apply Group.')
def the_edit_acl_page_should_open_select_open_for_default_acl_option_select_group_name_for_group_name_check_the_apply_group(driver):
    """The Edit ACL page should open, select OPEN for Default ACL Option, select "AD01\Administrator" for Group name, check the Apply Group.."""
    #assert wait_on_element(driver, 5, '//mat-card-title[text()="Unix Permissions Editor"]')
    #time.sleep(1)
    #assert wait_on_element(driver, 5, '//span[contains(text(),"Set ACL")]', 'clickable')
    #driver.find_element_by_xpath('//span[contains(text(),"Set ACL")]').click()
    time.sleep(2)
    #assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Default ACL Options"]', 'clickable')
    #driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    #time.sleep(1)
    #driver.find_element_by_xpath('//span[contains(text(),"NFS4_OPEN")]').click()
    #time.sleep(1)
    #assert wait_on_element(driver, 5, '//span[contains(text(),"Continue")]', 'clickable')
    #driver.find_element_by_xpath('//span[contains(text(),"Continue")]').click()
    #time.sleep(1)
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').click()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys('AD01\\administrator')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]').click()
    driver.find_element_by_xpath('//span[contains(text(),"Group")]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').send_keys('AD01\Domain users')
    time.sleep(1)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Permissions"]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//mat-selection-list//mat-option//span[contains(text(),"Full Control")]').click()


@then('click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "AD01\Administrator".')
def click_the_save_button_which_should_be_returned_to_the_storage_page_on_the_edit_acl_page_verify_that_the_group_name_is_ad01administrator(driver):
    """click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "AD01\Administrator".."""
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    time.sleep(8)
    assert wait_on_element(driver, 10, '//div[contains(text(),"tank_acl_dataset")]')
    time.sleep(2)
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath('//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 5, '//div[contains(text(),"AD01\\administrator")]')

    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)