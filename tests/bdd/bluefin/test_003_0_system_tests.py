# coding=utf-8
"""BLUEFIN UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1559.feature', 'System Tests')
def system_tests(driver):
    """system tests."""
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


@then('verify core file alert works')
def verify_core_file_alert_works(driver, nas_ip, root_password):
    """verify core file alert works"""
    import test_003_1_verify_core_file_alert_works
    test_003_1_verify_core_file_alert_works.test_verify_core_file_alert_works()


@then('verify the ssh host key is the same after reboot')
def verify_the_ssh_host_key_is_the_same_after_reboot(driver, nas_ip, root_password)):
    """erify the ssh host key is the same after reboot"""
    import test_003_2_verify_the_ssh_host_key_is_the_same_after_reboot
    test_003_2_verify_the_ssh_host_key_is_the_same_after_reboot.test_verify_the_ssh_host_key_is_the_same_after_reboot()


