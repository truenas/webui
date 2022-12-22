# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
import xpaths
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
from pytest_dependency import depends


@pytest.mark.dependency(name='ericbsd_dataset')
@scenario('features/NAS-T1134.feature', 'Create a new dataset with access permission to only ericbsd')
def test_create_a_new_dataset_with_access_permission_to_only_ericbsd():
    """Create a new dataset with access permission to only ericbsd."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Storage in the side menu and click the tank three dots and add dataset')
def you_should_be_on_the_dashboard_click_on_storage_in_the_side_menu_and_click_the_tank_three_dots_and_add_dataset(driver):
    """you should be on the dashboard, click on Storage in the side menu and click the tank three dots and add dataset."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


@then(parsers.parse('the add datasetpage should open, input "{dataset_name}" for the naem and click save'))
def the_add_datasetpage_should_open_input_ericbsd_dataset_for_the_naem_and_click_save(driver, dataset_name):
    """the add datasetpage should open, input "{dataset_name}" for the naem and click save."""
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)


@then(parsers.parse('the {dataset_name} should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit'))
def the_ericbsd_dataset_should_be_created_click_the_dataset_three_dots_and_select_view_permissions_then_click_the_pencil_to_edit(driver, dataset_name):
    """the {dataset_name} should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
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
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.builtinUsers_cancel, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.builtinUsers_cancel).click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.editAcl.builtinAdministrators_cancel, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.builtinAdministrators_cancel).click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner:") and contains(@class,"control")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').send_keys(user)
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and contains(@class,"control")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').send_keys(group)
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]').click()
    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()


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
