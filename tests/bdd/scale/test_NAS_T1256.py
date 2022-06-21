# coding=utf-8
"""SCALE UI: feature tests."""

import time
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
)


@scenario('features/NAS-T1256.feature', 'Verify that you can delete a group')
def test_verify_that_you_can_delete_a_group():
    """Verify that you can delete a group."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


@then('on the Groups page click to expand the gidtestdupe entry')
def on_the_groups_page_click_to_expand_the_gidtestdupe_entry(driver):
    """on the Groups page click to expand the gidtestdupe entry."""
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__gidtestdupe"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__gidtestdupe"]/td').click()


@then('click delete, click the confirm checkbox, and click delete')
def click_delete_click_the_confirm_checkbox_and_click_delete(driver):
    """click delete, click the confirm checkbox, and click delete."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE_gidtestdupe_gidtestdupe"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE_gidtestdupe_gidtestdupe"]').click()

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"DELETE")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"DELETE")]').click()


@then('verify the group was deleted')
def verify_the_group_was_deleted(driver):
    """verify the group was deleted."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element_disappear(driver, 10, '//div[contains(.,"gidtestdupe")]')
