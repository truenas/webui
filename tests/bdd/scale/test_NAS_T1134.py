# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1134.feature', 'Create a new dataset with access permission to only ericbsd')
def test_create_a_new_dataset_with_access_permission_to_only_ericbsd():
    """Create a new dataset with access permission to only ericbsd."""


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
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click on Storage in the side menu and click the tank three dots and add dataset')
def you_should_be_on_the_dashboard_click_on_storage_in_the_side_menu_and_click_the_tank_three_dots_and_add_dataset(driver):
    """you should be on the dashboard, click on Storage in the side menu and click the tank three dots and add dataset."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()   


@then(parsers.parse('the add datasetpage should open, input "{dataset_name}" for the naem and click save'))
def the_add_datasetpage_should_open_input_ericbsd_dataset_for_the_naem_and_click_save(driver, dataset_name):
    """the add datasetpage should open, input "{dataset_name}" for the naem and click save."""
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


@then(parsers.parse('the {dataset_name} should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit'))
def the_ericbsd_dataset_should_be_created_click_the_dataset_three_dots_and_select_view_permissions_then_click_the_pencil_to_edit(driver, dataset_name):
    """the {dataset_name} should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//mat-panel-title[contains(text(),"tank")]')
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]', 'clickable')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()


@then(parsers.parse('the Edit Permissions page should open, select "{user}" for User, click on the Apply User checkbox, select {group} for Group name, click on the Apply Group checkbox, click on Group Write Access, and click the Save button'))
def the_edit_permissions_page_should_open_select_ericbsd_for_user_click_on_the_apply_user_checkbox_select_ericbbsd_for_group_name_click_on_the_apply_group_checkbox_click_on_group_write_access_and_click_the_save_button(driver, user, group):
    """the Edit Permissions page should open, select "{user}" for User, click on the Apply User checkbox, select {group} for Group name, click on the Apply Group checkbox, click on Group Write Access, and click the Save button."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]').click()
    time.sleep(0.5)
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').send_keys(user)
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and contains(@class,"control")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').send_keys(group)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()


@then('you should be returned to the pool list page, click on the ericbsd_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open')
def you_should_be_returned_to_the_pool_list_page_click_on_the_ericbsd_dataset_three_dots_button_view_and_edit_permissions_and_the_edit_permissions_page_should_open(driver):
    """you should be returned to the pool list page, click on the ericbsd_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open."""
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element(driver, 10, '//mat-panel-title[contains(text(),"tank")]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"wheel_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


@then('verify that the user and group is ericbsd')
def verify_that_the_user_and_group_is_ericbsd(driver):
    """verify that the user and group is ericbsd."""
    assert wait_on_element(driver, 5, '//div[contains(text(),"owner@ - ericbsd")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"group@ - ericbsd")]')
    assert not is_element_present(driver, '//div[contains(text(),"Group - builtin_users")]')
