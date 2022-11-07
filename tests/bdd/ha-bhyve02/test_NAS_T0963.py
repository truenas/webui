# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""

import pytest
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='SMB_ACTIVE_Directory', scope='session')
@scenario('features/NAS-T963.feature', 'Add an ACL Item and verify is preserve')
def test_add_an_acl_item_and_verify_is_preserve(driver):
    """Add an ACL Item and verify is preserve."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """the browser is open, navigate to "{nas_url}"."""
    # depends(request, ['Active_Directory'], scope='session')
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter__user_and_password(driver, user, password):
    """if the login page appears, enter "{user}" and "{password}."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('on the Dashboard, click Dataset on the left sidebar')
def on_the_dashboard_click_dataset_on_the_left_sidebar(driver):
    """on the Dashboard, click Dataset on the left sidebar."""
    assert wait_on_element(driver, 7, '//span[contains(.,"Dashboard")]')
    if wait_on_element(driver, 4, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    assert wait_on_element(driver, 10, '//span[text()="System Information"]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Datasets"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Datasets"]').click()


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page, click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, '//h1[text()="Datasets"]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 5, f'//ix-tree-node[contains(.,"{dataset_name}")]')
    driver.find_element_by_xpath(f'//ix-tree-node[contains(.,"{dataset_name}")]').click()


@then('click on Edit beside Permissions card title')
def click_on_edit_beside_permissions_card_title(driver):
    """click on Edit beside Permissions card title."""
    assert wait_on_element(driver, 5, '//h3[text()="Permissions"]')
    assert wait_on_element(driver, 5, '//a[*/text()=" Edit "]')
    driver.find_element_by_xpath('//a[*/text()=" Edit "]').click()


@then('on the Edit ACL page, click on Add Item')
def on_the_edit_acl_page_click_on_add_item(driver):
    """on the Edit ACL page, click on Add Item."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Add Item")]').click()


@then('the new Access Control should appear, click on who and select User')
def the_new_access_control_should_appear_click_on_who_and_select_user(driver):
    """the new Access Control should appear, click on who and select User."""
    assert wait_on_element(driver, 7, '//div[text()="User - ?"]')
    assert wait_on_element(driver, 7, '//ix-select[@formcontrolname="tag"]//mat-select', 'clickable')
    driver.find_element_by_xpath('//ix-select[@formcontrolname="tag"]//mat-select').click()
    assert wait_on_element(driver, 5, '//mat-option[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[contains(.,"User")]').click()


@then(parsers.parse('in User input, enter "{username}" click the Save Access Control List'))
def in_user_input_enter_ericbsd_click_the_save_access_control_list(driver, username):
    """in User input, enter "ericbsd" click the Save Access Control List."""
    assert wait_on_element(driver, 7, '//ix-combobox[@formcontrolname="user"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname="user"]//input').send_keys(username)
    ActionChains(driver).send_keys(Keys.TAB).perform()
    assert wait_on_element(driver, 7, '//div[text()="User - ericbsd"]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[text()="Updating Dataset ACL"]')


@then(parsers.parse('on the Permission card, verify the new ACL item "{username}" exist'))
def on_the_permission_card_verify_the_new_acl_item_ericbsd_exist(driver, username):
    """on the Permission card, verify the new ACL item "ericbsd" exist."""
    assert wait_on_element(driver, 5, '//h3[text()="Permissions"]')
    assert wait_on_element(driver, 5, f'//div[text()="User - {username}"]')
