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


@scenario('features/NAS-T1560.feature', 'Bluefin UI: Group Tests')
def test_group_tests(driver,):
    """group tests."""
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

@then('create a group')
def create_a_group(driver):
    """create_a_group"""
    import t_004_1_create_a_group
    t_004_1_create_a_group.test_create_a_group(driver)


@then('verify group edit page works')
def verify_group_edit_page_works(driver):
    """verify group edit page works"""
    import t_004_2_verify_group_edit_page_works
    t_004_2_verify_group_edit_page_works.test_verify_group_edit_page_works(driver)


@then('change a group name')
def change_a_group_name(driver):
    """change_a_group_name"""
    import t_004_3_change_a_group_name
    t_004_3_change_a_group_name.test_change_a_group_name(driver)


@then('enabling sudo for group')
def enabling_sudo_for_group(driver, nas_ip):
    """enabling_sudo_for_group"""
    import t_004_4_enabling_sudo_for_group
    t_004_4_enabling_sudo_for_group.test_enabling_sudo_for_group(driver, nas_ip)


@then('groups can have duplicate GIDs')
def groups_can_have_duplicate_gids(driver):
    """groups_can_have_duplicate_gids"""
    import t_004_5_groups_can_have_duplicate_gids
    t_004_5_groups_can_have_duplicate_gids.test_groups_can_have_duplicate_gids(driver)


@then('delete a group')
def delete_a_group(driver):
    """delete_a_group"""
    import t_004_6_delete_a_group
    t_004_6_delete_a_group.test_delete_a_group(driver)