#!/usr/bin/env python

# Author: Eric Turgeon
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

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
         'rootButton' : "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/topbar/mat-toolbar/mat-toolbar-row/button[6]",
         'logoutButton' : "//*[contains(text(), 'Logout')]",
         'logoutconfirmationCheckbox' : "/html/body/div[3]/div[2]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div",
         'logoutconfirmationButton' : "//*[contains(text(), 'Ok')]"
         }

class logout_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_logout(self):
        print (" loging out of the ui, see ya")
        # Click on root account
        driver.find_element_by_xpath(xpaths['rootButton']).click()
        # Click on logout
        time.sleep(2)
        driver.find_element_by_xpath(xpaths['logoutButton']).click()
        time.sleep(2)
        # check the logout confirmation checkbox
        # driver.find_element_by_xpath(xpaths['logoutconfirmationCheckbox']).click()
        # Click on OK when re-confirm logout
        driver.find_element_by_xpath(xpaths['logoutconfirmationButton']).click()
        time.sleep(2)

    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper met:hod to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def screenshot(self, count):
        time.sleep(1)
        text_path = os.path.dirname(os.path.realpath(__file__))
        filename = str(__file__)
        filename = filename[:-3]
        final_file = filename.replace(text_path + "/", '')
        print ("Taking screenshot for " + final_file + " Test no:" count)
        driver.save_screenshot(cwd + "/screenshot/"  + "screenshot-" + final_file + "-" + count + ".png")

    @classmethod
    def tearDownClass(inst):
        driver.close()

def run_logout_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(logout_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
