# coding=utf-8
"""SCALE UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1071.feature', 'Create pool with 2 disks')
def test_create_pool_with_2_disks():
    """Create pool with 2 disks."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('when the Pools page appears, click Then select Click create pool')
def when_the_pools_page_appears_click_then_select_click_create_pool():
    """when the Pools page appears, click Then select Click create pool."""
    raise NotImplementedError


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu():
    """you should be on the dashboard, click Storage on the side menu."""
    raise NotImplementedError


@then('Create pool should appear while pool is being created')
def create_pool_should_appear_while_pool_is_being_created():
    """Create pool should appear while pool is being created."""
    raise NotImplementedError


@then('click create, On the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool():
    """click create, On the Warning widget, click confirm checkbox, click CREATE POOL."""
    raise NotImplementedError


@then('click sdb1 and sdb22 checkbox, press the right arrow under Data VDevs')
def click_sdb1_and_sdb22_checkbox_press_the_right_arrow_under_data_vdevs():
    """click sdb1 and sdb22 checkbox, press the right arrow under Data VDevs."""
    raise NotImplementedError


@then('when the Pool Manager appears, enter the tank for pool name')
def when_the_pool_manager_appears_enter_the_tank_for_pool_name():
    """when the Pool Manager appears, enter the tank for pool name."""
    raise NotImplementedError


@then('you should be returned to the list of pools and tank should appear in the list')
def you_should_be_returned_to_the_list_of_pools_and_tank_should_appear_in_the_list():
    """you should be returned to the list of pools and tank should appear in the list."""
    raise NotImplementedError

