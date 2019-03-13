# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

import function
from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = { 'navSystem' : "//*[@id='nav-2']/div/a[1]",
           'submenuUpdate' : "//*[@id='2-10']",
           'buttonChecknow' : "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card/div/div[3]/div/button[1]"
         }


class check_update_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_sys_update(self):
        try:
            # Click on the Update submenu
            driver.find_element_by_xpath(xpaths['submenuUpdate']).click()
            self.error_check_sys()
            # cancelling the tour
            if self.is_element_present(By.XPATH,"/html/body/div[6]/div[1]/button"):
                driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()
            # get the ui element
            ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li[2]/a")
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Update" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_02_check_update_now(self):
        try:
            # Click on the checknow button
            driver.find_element_by_xpath(xpaths['buttonChecknow']).click()
            time.sleep(2)
            # get the ui element, check if first element is present, if yes, check value text if as expected
            if self.is_element_present(By.XPATH,"/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card[1]/div/div[4]/div/table/tbody/tr[1]/td[1]"):
                ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card[1]/div/div[4]/div/table/tbody/tr[1]/td[1]")
                update_data=ui_element.text
                if update_data == "Upgrade":
                    print ("There is an available upgrade")
                    # assert response
                    self.assertTrue("Upgrade" in update_data)
                    self.error_check_sys()
                else:
                    print ("There is an unexpected issue: it is not an upgrade")
                    self.error_check_sys()
            elif self.is_element_present(By.XPATH,"/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-update/md-card/div/div[4]/div/div"):
                ui_element2=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-update/md-card/div/div[4]/div/div")
                update_data2=ui_element2.text
                if "No" in update_data2:
                    print ("There is no update available")
                    self.assertTrue("No" in update_data2)
                    self.error_check_sys()
                else:
                    print ("There is an unexpected issue: something wrong with no update available element:" + update_data2)
                    self.error_check_sys()
            else:
                print ("There is an unexpected issue")
                self.error_check_sys()
            #taking screenshot
            function.screenshot(driver, self)
            time.sleep(5)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check_sys(self):
        if (self.is_element_present(By.XPATH, "//*[contains(text(), 'Close')]")):
            driver.find_element_by_xpath("//*[contains(text(), 'Close')]").click()


    @classmethod
    def tearDownClass(inst):
        pass

def run_check_update_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(check_update_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
