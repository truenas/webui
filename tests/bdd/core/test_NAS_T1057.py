# coding=utf-8
"""Core feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1057.feature', 'Verify the Login to Jira button in System Support works')
def test_verify_the_login_to_jira_button_in_system_support_works():
    """Verify the Login to Jira button in System Support works."""
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
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on System on the side menu, click on Support')
def on_the_dashboard_click_on_system_on_the_side_menu_click_on_support(driver):
    """on the Dashboard, click on System on the side menu, click on Support."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Update"]', 'clickable')
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Update"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Support"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Support"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Support")]')


@then(parsers.parse('on the Support page, click on "{button_text}" button'))
def on_the_support_page_click_on_login_to_jira_button(driver, button_text):
    """on the Support page, click on "Login to Jira" button."""
    assert wait_on_element(driver, 7, f'//button[contains(.,"{button_text}")]')
    driver.find_element_by_xpath(f'//button[contains(.,"{button_text}")]').click()
    time.sleep(1)


@then('verify that the Login popup appears')
def verify_that_the_login_popup_appears(driver):
    """verify that the Login popup appears."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 7, '//span[@aria-label="Jira"]')
    assert wait_on_element(driver, 5, '//input[@id="username"]')
    assert wait_on_element(driver, 5, '//button[@id="login-submit"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[contains(.,"Continue with Google")]', 'clickable')
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
