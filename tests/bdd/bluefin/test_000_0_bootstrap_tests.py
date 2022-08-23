# coding=utf-8
"""BLUEFIN UI feature tests."""

from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1556.feature', 'Bluefin UI: Bootstrap Tests')
def test_bootstrap_tests(driver):
    """bootstrap_test"""
    pass


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
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

        #    """on the dashboard click on the System Settings side menu, then click services."""
        assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')

@then('enable root SSH')
def enable_root_ssh(driver, nas_ip, root_password):
    """enable root SSH"""
    import t_000_1_root_ssh
    t_000_1_root_ssh.test_root_ssh(nas_ip, driver, root_password)


@then(parsers.parse('set interface with "{nameserver1}" "{nameserver2}" "{nameserver3}" "{gateway}"'))
def set_interface(driver, nas_ip, nas_hostname, nameserver1, nameserver2, nameserver3, gateway):
    """set interface"""
    import t_000_2_set_interface
    t_000_2_set_interface.test_interface(driver, nas_ip, nas_hostname, nameserver1, nameserver2, nameserver3, gateway)


@then('create pool')
def create_pool(driver):
    """create pool"""
    import t_000_3_create_pool
    t_000_3_create_pool.test_create_pool(driver)
