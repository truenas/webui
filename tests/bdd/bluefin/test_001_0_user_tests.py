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
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1557.feature', 'User Tests')
def test_user_tests(driver):
    """user tests."""
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


@then('create a new user call ericbsd')
def create_a_new_user_call_ericbsd(driver):
    """Create a new user call ericbsd"""
    import t_001_1_new_user
    t_001_1_new_user.test_new_user(driver)


@then('change Shell for user')
def change_shell_for_userdriver(driver):
    """change Shell for user"""
    import t_001_2_change_user_shell
    t_001_2_change_user_shell.test_change_user_shell(driver)


@then('enable user Permit Sudo')
def enable_permit_sudo(driver, nas_ip):
    """enable user Permit Sudo"""
    import t_001_3_enable_permit_sudo
    t_001_3_enable_permit_sudo.test_enable_permit_sudo(driver, nas_ip)


@then('add an email to a user')
def add_email(driver):
    """add an email to a user"""
    import t_001_4_add_email
    t_001_4_add_email.test_add_email(driver)


@then('add root group')
def add_root_group(driver):
    """add root group"""
    import t_001_5_add_root_group
    t_001_5_add_root_group.test_add_root_group(driver)


@then('add home dir')
def add_home_dir(driver):
    """add home dir"""
    import t_001_6_add_home_dir
    t_001_6_add_home_dir.test_add_home_dir(driver)


@then('disable pass')
def disable_pass(driver, nas_ip):
    """disable pass"""
    import t_001_7_disable_pass
    t_001_7_disable_pass.test_disable_pass(driver, nas_ip)


@then('enable pass')
def enable_pass(driver, nas_ip):
    """enable pass"""
    import t_001_8_enable_pass
    t_001_8_enable_pass.test_enable_pass(driver, nas_ip)


@then('change pass')
def change_pass(driver, nas_ip):
    """change pass"""
    import t_001_9_change_pass
    t_001_9_change_pass.test_change_pass(driver, nas_ip)


@then('mismatched pass')
def mismatched_pass(driver):
    """mismatched pass"""
    import t_001_10_mismatched_pass
    t_001_10_mismatched_pass.test_mismatched_pass(driver)

@then('invalid_email')
def invalid_email(driver):
    """invalid email"""
    import t_001_11_invalid_email
    t_001_11_invalid_email.test_invalid_email(driver)


@then('change permissions on user home dir')
def change_permissions_on_user_home_dir(driver):
    """change permissions on user home dir"""
    import t_001_12_change_permissions_on_user_home_dir
    t_001_12_change_permissions_on_user_home_dir.test_change_permissions_on_user_home_dir(driver)


@then('user ssh key')
def user_ssh_key(driver, nas_ip):
    """user ssh key"""
#    import t_001_13_user_ssh_key
#    t_001_13_user_ssh_key.test_user_ssh_key(driver, nas_ip)