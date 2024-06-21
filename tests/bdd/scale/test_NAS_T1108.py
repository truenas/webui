# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    service_Start
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='AD_Dataset')
@scenario('features/NAS-T1108.feature', 'Create an Active Directory dataset on a system dataset pool')
def test_create_an_active_directory_dataset_on_a_system_dataset_pool():
    """Create an Active Directory dataset on a system dataset pool."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['AD_Setup'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()
    # TODO: remove when https://ixsystems.atlassian.net/browse/NAS-127071 is fixed.
    service_Start(nas_ip, ('root', root_password), 'cifs')


@when('on the Dashboard, click Dataset on the left sidebar')
def on_the_dashboard_click_dataset_on_the_left_sidebar(driver):
    """on the Dashboard, click Dataset on the left sidebar."""
    rsc.Verify_The_Dashboard(driver)
    rsc.Click_On_Element(driver, xpaths.side_Menu.datasets)


@then('on the Dataset page, click on the system pool tree and click Add Dataset')
def on_the_dataset_page_click_on_the_system_pool_tree_and_click_add_dataset(driver):
    """on the Dataset page, click on the system pool tree and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert  wait_on_element_disappear(driver, 15, xpaths.progress.progress_Spinner)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('system'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('system')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('system'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()


@then(parsers.parse('on the Add Dataset slide, input Name "{dataset_name}" and Share Type SMB'))
def on_the_add_dataset_slide_input_name_my_ad_dataset_and_share_type_smb(driver, dataset_name):
    """on the Add Dataset slide, input Name "my_ad_dataset" and Share Type SMB."""
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset_name)
    rsc.Click_On_Element(driver, xpaths.add_Dataset.share_Type_Select)
    rsc.Click_On_Element(driver, xpaths.add_Dataset.share_Type_SMB_Option)
    rsc.unset_checkbox(driver, xpaths.add_Dataset.create_Smb_Checkbox)


@then(parsers.parse('click Save the "{dataset_name}" data should be created'))
def click_save_the_my_ad_dataset_data_should_be_created(driver, dataset_name):
    """click Save the "my_ad_dataset" data should be created."""
    rsc.Click_On_Element(driver, xpaths.button.save)
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))


@then(parsers.parse('click on the "{dataset_name}" tree, click on Edit beside Permissions'))
def click_on_the_my_ad_dataset_tree_click_on_edit_beside_permissions(driver, dataset_name):
    """click on the "my_ad_dataset" tree, click on Edit beside Permissions."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button)
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()


@then(parsers.parse('on the Edit ACL page, input "{user_name}" for Owner, click Apply Owner'))
def on_the_edit_acl_input_the_user_name(driver, user_name):
    """on the Edit ACL page, input "{user_name}" for Owner, click Apply Owner."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.owner_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Combobox).clear()
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Combobox).send_keys(user_name)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(user_name), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(user_name)).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.owner_Apply_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Apply_Checkbox).click()


@then(parsers.parse('input "{group_name}" for Owner Group, click Apply Group'))
def input_the_group_name(driver, group_name):
    """input "{group_name}" for Group name."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.group_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Combobox).clear()
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Combobox).send_keys(group_name)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(group_name), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(group_name)).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.group_Apply_Checkbox)
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Apply_Checkbox).click()


@then('click the Save Access Control List button')
def click_the_save_access_control_list_button(driver):
    """click the Save Access Control List button."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('system'))
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()


@then(parsers.parse('on the permission card, verify the user is "{user_name}"'))
def on_the_permission_card_verify_the_user_is_user_name(driver, user_name):
    """on the permission card, verify the user is "{user_name}"."""
    element = driver.find_element_by_xpath(xpaths.dataset.permission_Title)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_At_Owner(user_name))


@then(parsers.parse('verify the group name is "{group_name}"'))
def verify_the_group_name_is_group_name(driver, group_name):
    """verify the group name is "{group_name}"."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_At_Group(group_name))
