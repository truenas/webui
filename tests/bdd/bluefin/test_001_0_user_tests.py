# coding=utf-8
"""SCALE UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1063.feature', 'User Tests')
def user_tests(driver):
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

        #    """on the dashboard, verify the Welcome box is loaded, click Close."""
        time.sleep(2)
        if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
            assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
            driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()

        #    """on the dashboard click on the System Settings side menu, then click services."""
        assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')

@then('create a new user call ericbsd')
def test_create_a_new_user_call_ericbsd(driver):
    """Create a new user call ericbsd"""
    import test_001_1_new_user
    test_001_1_new_user.test_new_user(driver)


@then('change Shell for user')
def test_change_shell_for_userdriver(driver):
    """change Shell for user"""
    import test_001_2_change_user_shell
    test_001_2_change_user_shell.test_change_user_shell(driver)


@then('enable user Permit Sudo')
def test_enable_permit_sudo(driver):
    """enable user Permit Sudo"""
    import test_001_3_enable_permit_sudo
    test_001_3_enable_permit_sudo.test_enable_permit_sudo(driver)


@then('add an email to a user')
def test_add_email(driver):
    """add an email to a user"""
    import test_001_4_add_email
    test_001_4_add_email.test_add_email(driver)


@then('add root group')
def test_add_root_group(driver):
    """add root group"""
    import test_001_5_add_root_group
    test_001_5_add_root_group.test_add_root_group(driver)


@then('add home dir')
def test_add_home_dir(driver):
    """add home dir"""
    import test_001_6_add_home_dir
    test_001_6_add_home_dir.test_add_home_dir(driver)


@then('disable pass')
def test_disable_pass(driver):
    """disable pass"""
    import test_001_7_disable_pass
    test_001_7_disable_pass.test_disable_pass(driver)


@then('enable pass')
def test_enable_pass(driver):
    """enable pass"""
    import test_001_8_enable_pass
    test_001_8_enable_pass.test_enable_pass(driver)


@then('change pass')
def test_change_pass(driver):
    """change pass"""
    import test_001_9_change_pass
    test_001_9_change_pass.test_change_pass(driver)


@then('mismatched pass')
def test_mismatched_pass(driver):
    """mismatched pass"""
    import test_001_10_mismatched_pass
    test_001_10_mismatched_pass.test_mismatched_pass(driver)

@then('invalid_email')
def test_invalid_email(driver):
    """invalid email"""
    import test_001_11_invalid_email
    test_001_11_invalid_email.test_invalid_email(driver)

@then('user ssh key')
def test_user_ssh_key(driver):
    """user ssh key"""
    import test_001_12_test_user_ssh_key
    test_001_12_user_ssh_key.test_test_user_ssh_key(driver)