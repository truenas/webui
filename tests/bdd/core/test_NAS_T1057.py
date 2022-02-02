# coding=utf-8
"""Core feature tests."""

import time
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


@scenario('features/NAS-T1057.feature', 'Verify the Register link in System Support works')
def test_verify_the_register_link_in_system_support_works(driver):
    """Verify the Register link in System Support works."""


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


@then(parsers.parse('on the Support page, click on "{anchor}"'))
def on_the_support_page_click_on_create_a_jira_account(driver, anchor):
    """on the Support page, click on "Create a Jira account"."""
    assert wait_on_element(driver, 7, f'//a[contains(.,"{anchor}")]')
    driver.find_element_by_xpath(f'//a[contains(.,"{anchor}")]').click()
    time.sleep(1)


@then('Verify that the Jira sign up web page comes up')
def verify_that_the_jira_sign_up_web_page_comes_up(driver):
    """Verify that the Jira sign up web page comes up."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 10, '//img[@alt="iX - Bug Tracker (Jira)"]')
    assert wait_on_element(driver, 7, '//h2[contains(.,"Sign up")]')
    assert wait_on_element(driver, 7, '//input[@id="signup-email"]', 'clickable')
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
