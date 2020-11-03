#!/usr/bin/python
import RPi.GPIO as GPIO
from subprocess import call
import time
import sys
import os
import struct
import subprocess

try:
    raw_input          # Python 2
except NameError:
    raw_input = input  # Python 3

bounce = 25

def handle_callback(chan):
            gpio = GPIO.input(chan)
            if gpio == 0:
               print(1)
            elif gpio == 1:
               print(0)

#cmdlen=len(sys.argv)
#print "CMDLEN: " ,cmdlen

if len(sys.argv) >= 1:
    cmd   = sys.argv[1].lower()
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    if cmd == "setstatus":
       pin=12
       GPIO.setup(pin,GPIO.OUT)
       if len(sys.argv) == 3:
          value = int(sys.argv[2])
          if(value == 0 or value == 1):
             GPIO.output(12,value)
       while True:
          try:
            data = raw_input()
            if 'close' in data:
               sys.exit(0)
            data = int(data)
          except(EOFError, SystemExit):
               GPIO.cleanup(pin)
               sys.exit(0)
          except:
            if len(sys.argv) == 3:
               data = int(sys.argv[2])
            else:
                data = 0
          if data != 0:
            data = 1
          GPIO.output(pin,data)
    elif cmd == "seterror":
       pin=13
       GPIO.setup(pin,GPIO.OUT)
       if len(sys.argv) == 3:
          value = int(sys.argv[2])
          if(value == 0 or value == 1):
             GPIO.output(pin,value)
       while True:
          try:
            data = raw_input()
            if 'close' in data:
               sys.exit(0)
            data = int(data)
          except(EOFError, SystemExit):
            GPIO.cleanup(pin)
            sys.exit(0)
          except:
            if len(sys.argv) == 3:
                 data = int(sys.argv[2])
            else:
                 data = 0
          if data != 0:
            data = 1
          GPIO.output(pin,data)
    elif cmd == "getstatus":
       GPIO.setup(12, GPIO.OUT)
       print(GPIO.input(12))
    elif cmd == "geterror":
       GPIO.setup(13, GPIO.OUT)
       print(GPIO.input(13))
    elif cmd == "getonoff":
       GPIO.setup(4, GPIO.IN, pull_up_down = GPIO.PUD_UP)
       GPIO.add_event_detect(4, GPIO.BOTH, callback=handle_callback)
       while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
            except (EOFError, SystemExit):
                GPIO.cleanup(pin)
                sys.exit(0)
    elif cmd == "getservice":
       GPIO.setup(5, GPIO.IN,pull_up_down = GPIO.PUD_UP)
       GPIO.add_event_detect(5, GPIO.BOTH, callback=handle_callback)
       while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
            except (EOFError, SystemExit):
                GPIO.cleanup(pin)
                sys.exit(0)
sys.exit(0)
