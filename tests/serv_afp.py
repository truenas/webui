# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

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

xpaths = { 'navService': '//*[@id="nav-8"]/div/a[1]',
           'turnoffConfirm': '//*[contains(text(), "OK")]'
         }

class conf_afp_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_nav_services(self):
        try:
            # Click  Service menu
            print ("navigating to service menu")
            driver.find_element_by_xpath(xpaths['navService']).click()
            # allowing the button to load
            time.sleep(1)
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Services" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_02_turnon_afp (self):
        try:
            print (" turning on the afp service")
            # scroll down
            driver.find_element_by_tag_name('body').send_keys(Keys.HOME)
            time.sleep(2)
            function.status_change(driver, self, "1", "start")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_03_checkif_afp_on (self):
        try:
            print (" check if afp turned on")
            time.sleep(2)
            #status check
            function.status_check(driver, "1")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_04_turnoff_afp (self):
        try:
            print (" turning off the afp service")
            time.sleep(2)
            function.status_change(driver, self, "1", "stop")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_05_checkif_afp_off (self):
        try:
            print (" check if afp turned off")
            time.sleep(2)
            # status check
            function.status_check(driver, "1")
            time.sleep(10)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True


    @classmethod
    def tearDownClass(inst):
        pass

def run_conf_afp_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(conf_afp_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
