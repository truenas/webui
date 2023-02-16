# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    get
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='System_Dataset', scope='session')
@scenario('features/NAS-T961.feature', 'Creating new pool and set it as System Dataset')
def test_creating_new_pool_and_set_it_as_system_dataset(driver):
    """Creating new pool and set it as System Dataset."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """the browser is open, navigate to "{nas_url}"."""
    depends(request, ["Setup_HA"], scope='session')
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 5, xpaths.login.user_Input)


@when(parsers.parse('the login page appears, enter "{admin_user}" and "{password}"'))
def the_login_page_appear_enter_root_and_password(driver, admin_user, password):
    """the login page appears, enter "{admin_user}" and "{password}"."""
    global root_Password, admin_User
    admin_User = admin_user
    root_Password = password

    rsc.Login_If_Not_On_Dashboard(driver, admin_user, password)


@then('you should see the dashboard and the System Information')
def you_should_see_the_dashboard_and_the_system_information(driver):
    """you should see the dashboard and the System Information."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('navigate to Storage')
def navigate_to_storage(driver):
    """navigate to Storage."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()


@then('when the storage page appears, click Create')
def when_the_storage_page_appears_click_create(driver):
    """when the storage page appears, click Create."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 7, '//a[contains(.,"Create Pool")]', 'clickable')
    driver.find_element_by_xpath('//a[contains(.,"Create Pool")]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')


@then('the Pool Manager page should open')
def the_pool_manager_page_should_open(driver):
    """the Pool Manager page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pool Manager")]')


@then(parsers.parse('enter {pool_name} for pool name, check the box next to {disk}'))
def enter_dozer_for_pool_name_check_the_box_next_to_sdb(driver, pool_name, disk):
    """enter dozer for pool name, check the box next to sdb."""
    assert wait_on_element(driver, 7, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').clear()
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys(pool_name)
    driver.find_element_by_xpath(f'//mat-checkbox[@id="pool-manager__disks-{disk}"]').click()
    if wait_on_element(driver, 3, '//mat-dialog-container[contains(.,"Warning: sd")]'):
        assert wait_on_element(driver, 5, '//button[*/text()=" Close "]', 'clickable')
        driver.find_element_by_xpath('//button[*/text()=" Close "]').click()


@then('press right arrow under data vdev, click on the Force checkbox')
def press_right_arrow_under_data_vdev_click_on_the_force_checkbox(driver):
    """press right arrow under data vdev, click on the Force checkbox."""
    assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()


@then('on the warning box, click Confirm checkbox and click CONTINUE')
def on_the_warning_box_click_confirm_checkbox_and_click_continue(driver):
    """on the warning box, click Confirm checkbox and click CONTINUE."""
    rsc.Confirm_Single_Disk(driver)


@then('click Create, click on Confirm checkbox and click CREATE POOL')
def click_create_click_on_confirm_checkbox_and_click_create_pool(driver):
    """click Create, click on Confirm checkbox and click CREATE POOL."""
    assert wait_on_element(driver, 7, '//button[@name="create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    rsc.Confirm_Creating_Pool(driver)


@then('Create Pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create Pool should appear while the pool is being created."""
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Create Pool")]')


@then('you should be returned to the list of Pools')
def you_should_be_returned_to_the_list_of_pools(driver):
    """you should be returned to the list of Pools."""
    assert wait_on_element(driver, 7, '//h1[text()="Storage Dashboard"]')


@then(parsers.parse('the {pool_name} pool should be on the Pools list'))
def the_dozer_pool_should_be_on_the_pools_list(driver, pool_name):
    """the "dozer" pool should be on the Pools list."""
    assert wait_on_element(driver, 7, f'//h2[text()="{pool_name}"]')


@then('navigate to System Setting and click Misc')
def navigate_to_system_setting_and_click_misc(driver):
    """navigate to System Setting and click Misc."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.advanced, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.advanced).click()


@then('the Advanced page should open')
def the_miscellaneous_page_should_open(driver):
    """the Advanced page should open."""
    assert wait_on_element(driver, 7, xpaths.advanced.title)
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Card)


@then('click on System Dataset')
def click_on_system_dataset(driver):
    """click on System Dataset."""
    assert wait_on_element(driver, 7, xpaths.advanced.system_Dataset_Pool_Configure_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.advanced.system_Dataset_Pool_Configure_Button).click()
    rsc.Close_Common_Warning(driver)


@then('the System Dataset page should open')
def the_system_dataset_page_should_open(driver):
    """the System Dataset page should open."""
    assert wait_on_element(driver, 5, xpaths.system_Dataset.title)


@then(parsers.parse('click on System Dataset Pool select {pool_name}, click Save'))
def click_on_system_dataser_pool_select_dozer_click_Save(driver, pool_name):
    """click on System Dataset Pool select dozer, click Save."""
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Select).click()
    assert wait_on_element(driver, 5, xpaths.system_Dataset.pool_Option(pool_name))
    driver.find_element_by_xpath(xpaths.system_Dataset.pool_Option(pool_name)).click()
    assert wait_on_element(driver, 30, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('Please wait should appear while settings are being applied')
def Please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    # assert need to be added after the UI get fix.
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 20, xpaths.advanced.system_Dataset_Pool_Pool('tank'))
    assert wait_on_element(driver, 5, xpaths.advanced.system_Dataset_Pool_Pool('dozer'))


@then('navigate to the dashboard')
def navigate_to_dashboard(driver):
    """navigate to The dashboard."""
    assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)


@then('refresh and wait for the second node to be up')
def refresh_and_wait_for_the_second_node_to_be_up(driver):
    """refresh and wait for the second node to be up"""
    assert wait_on_element(driver, 45, xpaths.toolbar.ha_Disabled)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    assert wait_on_element(driver, 60, '//span[contains(.,"Hostname:") and contains(.,"tn-bhyve06-nodeb")]')
    # 5 second to let the system get ready for the next step.
    time.sleep(5)


@then('verify the system dataset is dozer on the active node')
def verify_the_system_dataset_is_dozer_on_the_active_node(driver):
    """verify the system dataset is dozer on the active node."""
    results = get(host, '/systemdataset/', ('root', root_Password))
    assert results.status_code == 200, results.text
    assert results.json()['pool'] == 'dozer', results.text


@then('press Initiate Failover and confirm')
def press_initiate_failover_and_confirm(driver):
    """press Initiate Failover and confirm."""
    rsc.Trigger_Failover(driver)

    rsc.Confirm_Failover(driver)


@then('wait for the login and the HA enabled status and login')
def wait_for_the_login_and_the_HA_enabled_status_and_login(driver):
    """wait for the login and the HA enabled status and login."""
    rsc.HA_Login_Status_Enable(driver)

    rsc.Login(driver, admin_User, root_Password)

    assert wait_on_element(driver, 60, xpaths.dashboard.title)
    assert wait_on_element(driver, 120, xpaths.dashboard.system_Info_Card_Title)
    if wait_on_element(driver, 2, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    # Make sure HA is enable before going forward
    assert wait_on_element(driver, 120, '//span[contains(.,"Hostname:") and contains(.,"tn-bhyve06-nodea")]')
    assert wait_on_element(driver, 60, xpaths.toolbar.ha_Enabled)
    time.sleep(5)


@then('verify the system dataset is dozer on the active node after failover')
def verify_the_system_dataset_is_dozer_on_the_active_node_after_failover(driver):
    """verify the system dataset is dozer on the active node after failover."""
    results = get(host, '/systemdataset/', ('root', root_Password))
    assert results.status_code == 200, results.text
    assert results.json()['pool'] == 'dozer', results.text
