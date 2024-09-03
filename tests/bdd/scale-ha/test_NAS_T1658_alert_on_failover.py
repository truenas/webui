"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    ssh_cmd,
    get
)
from pytest_dependency import depends
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.fixture(scope='module')
def notification():
    return {}


@scenario('features/NAS-T1658.feature', 'Verify that a degraded pool alert is kept after failover')
def test_verify_that_a_degraded_pool_alert_is_kept_after_failover():
    """Verify that a degraded pool alert is kept after failover."""


@given(parsers.parse('the browser is open to {nas_hostname} login with {user} and {password}'))
def the_browser_is_open_to_nas_hostname_login_with_user_and_password(driver, nas_vip, user, password, request):
    """the browser is open to <nas_hostname> login with <user> and <password>."""
    depends(request, ["Setup_HA"], scope='session')
    global admin_User, admin_Password
    admin_User = user
    admin_Password = password
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")

    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@when('on the Dashboard, look at the number of alerts')
def on_the_dashboard_look_at_the_number_of_alerts(driver, notification):
    """on the Dashboard, look at the number of alerts."""
    rsc.Verify_The_Dashboard(driver)


@then('degraded the tank pool to create an alert and verify that the pool is degraded')
def degraded_the_tank_pool_to_create_an_alert_and_verify_that_the_pool_is_degraded(nas_vip):
    """degraded the tank pool to create an alert and verify that the pool is degraded."""
    global gptid
    get_pool = get(nas_vip, "/pool/?name=tank", (admin_User, admin_Password)).json()[0]

    id_path = '/dev/disk/by-partuuid/'
    gptid = get_pool['topology']['data'][0]['path'].replace(id_path, '')
    cmd = f'zinject -d {gptid} -A fault tank'
    results = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results['result'] is True, results['output']

    cmd = f'zpool status tank | grep {gptid}'
    results = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results['result'] is True, results['output']
    assert 'DEGRADED' in results['output'], results['output']


@then('wait for the alert to appear and verify the volume and the state is degraded')
def wait_for_the_alert_to_appear_and_verify_the_volume_and_the_state_is_degraded(driver, notification):
    """wait for the alert to appear and verify the volume and the state is degraded."""
    assert wait_on_element(driver, 7, xpaths.toolbar.notification)

    rsc.Verify_Degraded_Alert(driver)


@then('on the Dashboard, click Initiate Failover on the standby controller')
def on_the_dashboard_click_initiate_failover_on_the_standby_controller(driver):
    """on the Dashboard, click Initiate Failover on the standby controller."""
    rsc.Verify_The_Dashboard(driver)

    rsc.Trigger_Failover(driver)


@then('on the Initiate Failover box, check the Confirm checkbox, then click Failover')
def on_the_initiate_failover_box_check_the_confirm_checkbox_then_click_failover(driver):
    """on the Initiate Failover box, check the Confirm checkbox, then click Failover."""
    rsc.Confirm_Failover(driver)


@then(parsers.parse('wait for the login to appear and HA to be enabled, login with {user} and {password}'))
def wait_for_the_login_to_appear_and_ha_to_be_enabled_login_with_user_and_password(driver, user, password):
    """wait for the login to appear and HA to be enabled, login with <user> and <password>."""
    rsc.HA_Login_Status_Enable(driver)

    rsc.Login(driver, user, password)


@then('on the Dashboard, verify the alert exists after failover with the right volume and state')
def on_the_dashboard_verify_the_alert_exists_after_failover_with_the_right_volume_and_state(driver, notification):
    """on the Dashboard, verify the alert exists after failover with the right volume and state."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # if there is prefious the License Agrement might show up
    rsc.License_Agrement(driver)
    rsc.Verify_Degraded_Alert(driver)


@then('fix the degraded pool and verify that the pool is fixed')
def fix_the_degraded_pool_and_verify_that_the_pool_is_fixed(nas_vip):
    """fix the degraded pool and verify that the pool is fixed."""
    cmd = 'zpool clear tank'
    results = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results['result'] is True, results['output']

    cmd = f'zpool status tank | grep {gptid}'
    results = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results['result'] is True, results['output']
    assert 'DEGRADED' not in results['output'], results['output']


@then('then wait for the alert to disappear and trigger failover again')
def then_wait_for_the_alert_to_disappear_and_trigger_failover_again(driver, notification):
    """then wait for the alert to disappear and trigger failover again."""

    rsc.Verify_Degraded_Alert_Is_Gone(driver)

    rsc.Trigger_Failover(driver)

    rsc.Confirm_Failover(driver)


@then('on the Dashboard, verify that there is no degraded pool alert')
def on_the_dashboard_verify_that_there_is_no_degraded_pool_alert(driver):
    """on the Dashboard, verify that there is no degraded pool alert."""
    assert wait_on_element(driver, 7, xpaths.toolbar.notification)

    rsc.Verify_Degraded_Alert_Is_Gone(driver)
