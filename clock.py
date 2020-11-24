from apscheduler.schedulers.blocking import BlockingScheduler
import time
import requests
from subprocess import call
import shutil
import os

sched = BlockingScheduler()

@sched.scheduled_job('interval', minutes=25)
def timed_job_awake_your_app():
    print('awake app every 2 minutes.')
    url = 'https://online-download-youtube.herokuapp.com/'
    requests.get(url)
    if os.path.isdir('mysite/media'):
        shutil.rmtree('mysite/media')
    if not os.path.isdir('mysite/media'):
        os.mkdir('mysite/media')
    if not os.path.isdir('mysite/media/message'):
        os.mkdir('mysite/media/message')

sched.start()
