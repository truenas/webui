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
    when
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1286.feature', 'Apps Page remove and readd pool')
def test_apps_page_remove_and_readd_pool():
    """Apps Page remove and readd pool."""


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
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[text()="Applications"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    # Wait for Available Applications UI to load
    assert wait_on_element(driver, 60, '//h3[text()="plex"]')
    assert wait_on_element(driver, 15, '//div[contains(.,"plex") and @class="content"]//button', 'clickable')
    # Sleep to make sure that the drop does not disappear
    time.sleep(2)


@then('the Apps page load, click settings, unset pool')
def the_apps_page_load_click_settings_unset_pool(driver):
    """the Apps page load, click settings, unset pool."""
    assert wait_on_element(driver, 20, '//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Unset Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Unset Pool")]').click()
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')


@then('confirm unset pool and wait')
def confirm_unset_pool_and_wait(driver):
    """confirm unset pool and wait."""
    assert wait_on_element(driver, 10, '//span[contains(text(),"UNSET")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"UNSET")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('click setting, reset pool')
def click_setting_reset_pool(driver):
    """click setting, reset pool."""
    assert wait_on_element(driver, 10, '//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Choose Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Choose Pool")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Pools"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Pools_tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Pools_tank"]').click()
    assert wait_on_element(driver, 7, '//button[@name="Choose_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="Choose_button"]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')
