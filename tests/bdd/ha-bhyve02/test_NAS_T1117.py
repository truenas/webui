"""High Availability (tn-bhyve03) feature tests."""

from selenium.webdriver.common.keys import Keys
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    get
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1117.feature', 'Setting up NIS and verify that NIS still work after failover')
def test_setting_up_nis_and_verify_that_nis_still_work_after_failover():
    """Setting up NIS and verify that NIS still work after failover."""
    pass


@given(parsers.parse('the browser is open on "{virtal_hostname}" and logged in'))
def the_browser_is_open_on_virtal_hostname_and_logged_in(driver, virtal_hostname):
    """the browser is open on "{virtal_hostname}" and logged in."""
    if virtal_hostname not in driver.current_url:
        driver.get(f"http://{virtal_hostname}/ui/dashboard/")
        time.sleep(1)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys('testing')
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, xpaths.breadcrumb.dashboard):
        driver.refresh()
        assert wait_on_element(driver, 10, xpaths.sideMenu.root)
        element = driver.find_element_by_xpath(xpaths.sideMenu.root)
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you see the Dashboard go to Directory Services and select NIS')
def you_see_the_dashboard_go_to_directory_services_and_select_nis(driver):
    """you see the Dashboard go to Directory Services and select NIS."""
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    assert wait_on_element(driver, 5, xpaths.dashboard.system_information)
    if wait_on_element(driver, 5, xpaths.button.i_Agree, 'clickable'):
        driver.find_element_by_xpath(xpaths.button.i_Agree).click()
    if wait_on_element(driver, 2, xpaths.popup.help):
        assert wait_on_element(driver, 10, xpaths.button.close)
        driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element(driver, 5, xpaths.sideMenu.directory_services, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services_nis)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services_nis).click()


@then('on the NIS page input the <nis_domian>, <nis_server> then click Enable checkbox')
def on_the_nis_page_input_the_nis_domian_nis_server_then_click_enable_checkbox(driver, nis_domian, nis_server):
    """on the NIS page input the <nis_domian>, <nis_server> then click Enable checkbox."""
    assert wait_on_element(driver, 5, '//li[span/a/text()="NIS"]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Network Information Service (NIS)")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="NIS Domain"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="NIS Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="NIS Domain"]').send_keys(nis_domian)
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').send_keys(nis_server + Keys.ENTER)
    assert wait_on_element(driver, 5, xpaths.checkbox.enable, 'clickable')
    time.sleep(1)
    value_exist = attribute_value_exist(driver, xpaths.checkbox.enable, 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.checkbox.enable).click()


@then('click SAVE, then "Please wait" should appear, and you should see "Settings saved."')
def click_save_then_please_wait_should_appear_and_you_should_see_settings_saved(driver):
    """click SAVE, then "Please wait" should appear, and you should see "Settings saved."."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.popup.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')
    # allow time for the NAS to settle down
    time.sleep(10)


@then('verify there is non local user and group with API call')
def verify_there_is_non_local_user_and_group_with_api_call(driver, virtal_hostname):
    """verify there is non local user and group with API call."""
    payload = {
        'query-filters': [['local', '=', False]],
        'query-options': {'extra': {"search_dscache": True}}
    }
    user_results = get(virtal_hostname, '/user', ('root', 'testing'), payload)
    assert user_results.status_code == 200, user_results.text
    assert len(user_results.json()) > 0, user_results.text

    # Verify that NIS groups are in cache
    results = get(virtal_hostname, '/group', ('root', 'testing'), payload)
    assert results.status_code == 200, results.text
    assert len(results.json()) > 0, results.text


@then('go to the Dashboard, verify HA is enabled, then Trigger failover')
def go_to_the_dashboard_verify_ha_is_enabled_then_trigger_failover(driver):
    """go to the Dashboard, verify HA is enabled, then Trigger failover."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.root)
    element = driver.find_element_by_xpath(xpaths.sideMenu.root)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    # wait_on_element need to be replace with wait_on_element when NAS-118299
    assert wait_on_element(driver, 10, xpaths.topToolbar.ha_enable)
    assert wait_on_element(driver, 60, xpaths.button.initiate_failover, 'clickable')
    driver.find_element_by_xpath(xpaths.button.initiate_failover).click()
    assert wait_on_element(driver, 5, xpaths.popup.initiate_failover)
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.failover)
    driver.find_element_by_xpath(xpaths.button.failover).click()


@then('on the login, wait to see HA is enabled before login')
def on_the_login_wait_to_see_ha_is_enabled_before_login(driver):
    """on the login, wait to see HA is enabled before login."""
    assert wait_on_element(driver, 120, xpaths.login.user_input)
    # wait for HA is enabled to avoid UI refreshing
    assert wait_on_element(driver, 300, xpaths.login.ha_status('HA is enabled'))
    assert wait_on_element(driver, 7, xpaths.login.user_input)
    driver.find_element_by_xpath(xpaths.login.user_input).clear()
    driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_input).clear()
    driver.find_element_by_xpath(xpaths.login.password_input).send_keys('testing')
    assert wait_on_element(driver, 4, xpaths.login.signin_button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_button).click()


@then('on the Dashboard, make sure HA is enabled')
def on_the_dashboard_make_sure_ha_is_enabled(driver):
    """on the Dashboard, make sure HA is enabled."""
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    assert wait_on_element(driver, 60, xpaths.dashboard.system_information)
    if wait_on_element(driver, 5, xpaths.button.i_Agree, 'clickable'):
        driver.find_element_by_xpath(xpaths.button.i_Agree).click()
    if wait_on_element(driver, 3, xpaths.popup.help):
        assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
    # wait_on_element need to be replace with wait_on_element when NAS-118299
    assert wait_on_element(driver, 30, xpaths.topToolbar.ha_enable)
    # allow time for the NAS to settle down
    time.sleep(5)


@then('click on Directory Services and select NIS, then disable NIS')
def click_on_Directory_Services_and_select_NIS_then_disable_NIS(driver):
    """click on Directory Services and select NIS, then disable NIS."""
    assert wait_on_element(driver, 5, xpaths.sideMenu.directory_services, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services_nis)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services_nis).click()
    assert wait_on_element(driver, 5, '//li[span/a/text()="NIS"]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Network Information Service (NIS)")]')
    # Clear settings
    assert wait_on_element(driver, 5, '//input[@placeholder="NIS Domain"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="NIS Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').click()
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').send_keys(Keys.BACKSPACE)
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').send_keys(Keys.BACKSPACE)
    driver.find_element_by_xpath('//input[@placeholder="NIS Servers"]').send_keys(Keys.BACKSPACE)
    assert wait_on_element(driver, 5, xpaths.checkbox.enable, 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.checkbox.enable, 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath(xpaths.checkbox.enable).click()
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.popup.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')
