#!/usr/bin/python
import serial
import requests
import time
import atexit
import os
import sys

pid = str(os.getpid())
pidfile = "/tmp/light.pid"

def is_process_running(process_id):
    try:
        os.kill(process_id, 0)
        return True
    except OSError:
        return False

if os.path.exists(pidfile):
    print("pid running")
    pid_running = int(open(pidfile).read())
    if(is_process_running(pid_running)):
        sys.exit()
    
else:
    file(pidfile, 'w').write(pid)

def goodbye():
    os.remove(pidfile)

atexit.register(goodbye)


state = 0;

ser = serial.Serial('/dev/ttyACM0', 9600)
while True:

    temp = ser.readline()
    temp = temp.rstrip()
    print("http://home.tomasharkema.nl/light/"+temp+"/")
    r = requests.get("http://home.tomasharkema.nl/light/"+temp+"/")
    r.connection.close()
    time.sleep(10)
