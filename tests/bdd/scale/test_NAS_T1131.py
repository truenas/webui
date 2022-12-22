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


@pytest.mark.dependency(name='755_dataset')
@scenario('features/NAS-T1131.feature', 'Create a new dataset with the wheel group with 775 permission')
def test_create_a_new_dataset_with_the_wheel_group_with_775_permission():
    """Create a new dataset with the wheel group with 775 permission."""


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


@when('on the Dashboard, click Dataset on the left sidebar')
def on_the_dashboard_click_dataset_on_the_left_sidebar(driver):
    """on the Dashboard, click Dataset on the left sidebar."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()


@then('on the Dataset page, click on the system pool tree and click Add Dataset')
def on_the_dataset_page_click_on_the_system_pool_tree_and_click_add_dataset(driver):
    """on the Dataset page, click on the system pool tree and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('system'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('system')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('system'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_dataset_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_dataset_button).click()


@then(parsers.parse('on the Add Dataset slide, input Name "{dataset_name}" and Share Type SMB'))
def on_the_add_dataset_slide_input_name_my_ad_dataset_and_share_type_smb(driver, dataset_name):
    """on the Add Dataset slide, input Name "my_ad_dataset" and Share Type SMB."""
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, xpaths.addDataset.name_textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.addDataset.name_textarea).clear()
    driver.find_element_by_xpath(xpaths.addDataset.name_textarea).send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()


@then(parsers.parse('click Save the "{dataset_name}" data should be created'))
def click_save_the_my_ad_dataset_data_should_be_created(driver, dataset_name):
    """click Save the "my_ad_dataset" data should be created."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset_name))


@then(parsers.parse('click on the "{dataset_name}" tree, click on Edit beside Permissions'))
def click_on_the_my_ad_dataset_tree_click_on_edit_beside_permissions(driver, dataset_name):
    """click on the "my_ad_dataset" tree, click on Edit beside Permissions."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_edit_button)
    driver.find_element_by_xpath(xpaths.dataset.permission_edit_button).click()


@then(parsers.parse('on the Edit ACL page, input "{user_name}" for Owner, click Apply Owner'))
def on_the_edit_acl_input_the_user_name(driver, user_name):
    """On the Edit ACL, input "{user_name}" for User name."""
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.owner_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.owner_combobox).clear()
    driver.find_element_by_xpath(xpaths.editAcl.owner_combobox).send_keys(user_name)
    assert wait_on_element(driver, 5, xpaths.editAcl.combobox_option(user_name), 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.combobox_option(user_name)).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.ownerApply_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.ownerApply_checkbox).click()


@then(parsers.parse('input "{group_name}" for Owner Group, click Apply Group'))
def input_the_group_name(driver, group_name):
    """input "{group_name}" for Group name."""
    assert wait_on_element(driver, 5, xpaths.editAcl.group_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.group_combobox).clear()
    driver.find_element_by_xpath(xpaths.editAcl.group_combobox).send_keys(group_name)
    assert wait_on_element(driver, 5, xpaths.editAcl.combobox_option(group_name), 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.combobox_option(group_name)).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.gourpApply_checkbox)
    driver.find_element_by_xpath(xpaths.editAcl.gourpApply_checkbox).click()


@then('clear built in user and administrators and click the Save Access Control List button')
def clear_built_in_user_and_administrators_and_click_the_save_access_control_list_button(driver):
    """clear built in user and administrators and click the Save Access Control List button."""
    assert wait_on_element(driver, 5, xpaths.editAcl.builtinUsers_cancel, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.builtinUsers_cancel).click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.editAcl.builtinAdministrators_cancel, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.builtinAdministrators_cancel).click()
    time.sleep(0.5)

    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updatingAcl)


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('system'))
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset_name)).click()


@then(parsers.parse('on the permission card, verify the user is "{user_name}"'))
def on_the_permission_card_verify_the_user_is_user_name(driver, user_name):
    """on the permission card, verify the user is "{user_name}"."""
    element = driver.find_element_by_xpath(xpaths.dataset.permission_tile)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.dataset.permissionAtOwner(user_name))


@then(parsers.parse('verify the group name is "{group_name}"'))
def verify_the_group_name_is_group_name(driver, group_name):
    """verify the group name is "{group_name}"."""
    assert wait_on_element(driver, 5, xpaths.dataset.permissionAtGroup(group_name))
