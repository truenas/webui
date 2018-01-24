
#!/usr/bin/env python

"""
Switch autoflush on/off for the standard output.
Well, the easiest way is to use sys.stdout.flush() :)
But if it's too simple for you, here are some more
sophisticated solutions to set stdout to be buffered/unbuffered.
unbuffered():
    Makes the stdout unbuffered, i.e. switch autoflush on.
    Deprecated. Left for backward compatibility.
buffered():
    Makes the stdout buffered, i.e. switch autoflush off.
    Deprecated. Left for backward compatibility.
autoflush(True|False):
    Set autoflush on or off.
    Call this instead of unbuffered() and buffered().
AutoFlush:
    Context manager. It is the most elegant way.
Thanks to python-list for correcting this module.
# from jabbapylib.console.autoflush import autoflush
# from jabbapylib.console.autoflush import AutoFlush
"""

import sys
import os
from time import sleep
import warnings

unbuffered_flag = False
stdout_bak = sys.stdout
warnings.simplefilter("always")


def unbuffered():
    """
    Switch autoflush on. Deprecated.
    """
    global unbuffered_flag
    warnings.warn("deprecated", DeprecationWarning)
    # reopen stdout file descriptor with write mode
    # and 0 as the buffer size (unbuffered)
    if not unbuffered_flag:
        sys.stdout.flush()    # Ulrich E.
        sys.stdout = os.fdopen(os.dup(sys.stdout.fileno()), 'w', 0)    # Piet van O., using os.dup
        unbuffered_flag = True


def buffered():
    """
    Switch autoflush off. Deprecated.
    """
    global unbuffered_flag
    warnings.warn("deprecated", DeprecationWarning)

    if unbuffered_flag:
        sys.stdout.flush()    # might be unnecessary
        sys.stdout = stdout_bak
        unbuffered_flag = False


def autoflush(set):
    """
    Sets autoflush on/off.
    If set is True, autoflush is activated (unbuffered mode).
    If set is False, autoflush is off (buffered mode).
    """
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if set:
            unbuffered()
        else:
            buffered()


class AutoFlush(object):    # Terry R.'s idea was to use a context manager
    """
    Context manager for controlling buffered/unbuffered output.
    """
    def __enter__(self):
        sys.stdout.flush()
        self.stdout_bak = sys.stdout
        sys.stdout = os.fdopen(os.dup(sys.stdout.fileno()), 'w', 0)

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.flush()    # might be unnecessary
        sys.stdout = self.stdout_bak

#############################################################################

if __name__ == "__main__":
#    unbuffered()
    print ("unbuffered text")

    for i in range(20):
        sys.stdout.write('.')
#        sys.stdout.flush()
        sleep(.5)
        if i == 6:
            autoflush(True)
        if i == 10:
            autoflush(False)
        if i == 14:
            autoflush(True)
    #
    print
    autoflush(False)

    with AutoFlush():
        for i in range(5):
            sys.stdout.write('.')
            sleep(.5)

    sys.stdout.write('EXIT')
print
