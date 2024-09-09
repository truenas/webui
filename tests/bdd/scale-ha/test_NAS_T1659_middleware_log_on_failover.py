"""SCALE High Availability (tn-bhyve06) feature tests."""

import reusableSeleniumCode as rsc
import xpaths
from function import (
    ssh_cmd,
    post,
    wait_on_element
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends



@scenario('features/NAS-T1659.feature', 'Verify middleware logs is available after failover')
def test_verify_middleware_logs_is_available_after_failover():
    """Verify middleware logs is available after failover."""


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


@when('on the Dashboard, verify the middleware logs exist')
def on_the_dashboard_verify_the_middleware_logs_exist(driver, nas_vip):
    """on the Dashboard, verify the middleware logs exist."""
    rsc.Verify_The_Dashboard(driver)

    results = post(nas_vip, '/filesystem/stat/',
                   (admin_User, admin_Password), '/var/log/middlewared.log')
    assert results.status_code == 200, results.text

    cmd = "cat /var/log/middlewared.log"
    middlewared_log = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert middlewared_log['result'] is True, str(middlewared_log)


@then('click Initiate Failover on the standby controller')
def on_the_dashboard_click_initiate_failover_on_the_standby_controller(driver):
    """on the Dashboard, click Initiate Failover on the standby controller."""
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


@then('on the Dashboard, verify the middleware logs still exist')
def on_the_dashboard_verify_the_middleware_logs_still_exist(driver, nas_vip):
    """on the Dashboard, verify the middleware logs still exist."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # if there is prefious the License Agrement might show up
    rsc.License_Agrement(driver)

    results = post(nas_vip, '/filesystem/stat/',
                   (admin_User, admin_Password), '/var/log/middlewared.log')
    assert results.status_code == 200, results.text

    cmd = "cat /var/log/middlewared.log"
    middlewared_log = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert middlewared_log['result'] is True, str(middlewared_log)
