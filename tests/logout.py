#!/usr/bin/env python

# Author: Eric Turgeon
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

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

xpaths = {
         'rootButton' : "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/topbar/mat-toolbar/mat-toolbar-row/button[6]/span/mat-icon",
         'logoutButton' : "//*[contains(text(), 'Log out')]",
         'logoutconfirmationCheckbox' : "/html/body/div[3]/div[2]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div",
         'logoutconfirmationButton' : "//*[contains(@name, 'ok_button')]"
         }

class logout_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_logout(self):
        try:
            print (" loging out of the ui, see ya")
            # Click on root account
            driver.find_element_by_xpath(xpaths['rootButton']).click()
            # Click on logout
            time.sleep(2)
            driver.find_element_by_xpath(xpaths['logoutButton']).click()
            time.sleep(2)
            # Click on OK when re-confirm logout
#            driver.find_element_by_xpath(xpaths['logoutconfirmationButton']).click()
#            time.sleep(2)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    @classmethod
    def tearDownClass(inst):
        driver.close()

def run_logout_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(logout_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
