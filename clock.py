from apscheduler.schedulers.blocking import BlockingScheduler
import time
import requests
from subprocess import call
import shutil
import os

sched = BlockingScheduler()

@sched.scheduled_job('interval', minutes=29)
def timed_job_awake_your_app():
    print('awake app every 29 minutes.')
    url = 'https://online-download-youtube.herokuapp.com'
    requests.get(url)
    shutil.rmtree('mysite/media')
    os.mkdir('mysite/media')
    os.mkdir('mysite/media/message')

sched.start() 