# coding=utf-8
"""SCALE UI Validation feature tests."""

from function import (
    wait_on_element,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1063.feature', 'Login and verify the Dashboard is loading')
def test_login_and_verify_the_dashboard_is_loading(driver):
    """Login and verify the Dashboard is loading."""


@given('the browser is open, navigate to the TrueNAS SCALE URL')
def the_browser_is_open_navigate_to_the_truenas_scale_url(driver, nas_ip):
    """the browser is open, navigate to the TrueNAS SCALE URL."""
    driver.get(f"http://{nas_ip}")


@when('on the login page, enter the root user and is password')
def on_the_login_page_enter_the_root_user_and_is_password(driver, root_password):
    """on the login page, enter the root user and is password."""
    assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
    assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('on the dashboard, verify the Welcome box is loaded, click Close')
def on_the_dashboard_verify_the_welcome_box_is_loaded_click_close(driver):
    """on the dashboard, verify the Welcome box is loaded, click Close."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__I AGREE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Welcome to your new NAS")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('verify the System Information card is loaded with the Overview')
def verify_the_system_information_card_is_loaded_with_the_overview(driver):
    """verify the System Information card is loaded with the Overview."""
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')
    assert is_element_present(driver, '//div[contains(.,"Overview")]')


@then('verify the CPU card is loaded with the Avg Usage')
def verify_the_cpu_card_is_loaded_with_the_avg_usage(driver):
    """verify the CPU card is loaded with the Avg Usage."""
    assert wait_on_element(driver, 5, '//div[contains(.,"CPU")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Avg Usage")]')


@then('verify the Memory card is loaded with the total available')
def verify_the_memory_card_is_loaded_with_the_total_available(driver):
    """verify the Memory card is loaded with the total available."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Memory")]')
    assert wait_on_element(driver, 5, '//span[contains(.,"total available")]')


@then('verify the Interface card is loaded with the Overview')
def verify_the_interface_card_is_loaded_with_the_overview(driver):
    """verify the Interface card is loaded with the Overview."""
    assert wait_on_element(driver, 5, '//span[contains(.,"Interface")]')
    assert is_element_present(driver, '//div[contains(.,"Overview")]')
