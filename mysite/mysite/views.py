from django.shortcuts import render
from django.http import HttpResponse
from mysite.settings import MEDIA_ROOT
from subprocess import Popen, PIPE, STDOUT, call
from threading import Thread
import mimetypes
import re
import os
from wsgiref.util import FileWrapper
from django.http import StreamingHttpResponse
from moviepy.editor import VideoFileClip


def file_iterator(file_name, chunk_size=8192, offset=0, length=None):
    with open(file_name, "rb") as f:
        f.seek(offset, os.SEEK_SET)
        remaining = length
        while True:
            bytes_length = chunk_size if remaining is None else min(
                remaining, chunk_size)
            data = f.read(bytes_length)
            if not data:
                break
            if remaining:
                remaining -= len(data)
            yield data


def stream_video(request, path):
    """將視訊檔案以流媒體的方式響應"""
    path = MEDIA_ROOT + path
    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_re = re.compile(r'bytes\s*=\s*(\d+)\s*-\s*(\d*)', re.I)
    range_match = range_re.match(range_header)
    size = os.path.getsize(path)
    content_type = mimetypes.guess_type(path)
    content_type = content_type or 'application/octet-stream'
    if range_match:
        first_byte, last_byte = range_match.groups()
        first_byte = int(first_byte) if first_byte else 0
        last_byte = first_byte + 1024 * 1024 * 8    # 8M 每片,響應體最大體積
        if last_byte >= size:
            last_byte = size - 1
        length = last_byte - first_byte + 1
        resp = StreamingHttpResponse(file_iterator(
            path, offset=first_byte, length=length), status=206, content_type=content_type)
        resp['Content-Length'] = str(length)
        resp['Content-Range'] = 'bytes %s-%s/%s' % (
            first_byte, last_byte, size)
    else:
        # 不是以視訊流方式的獲取時，以生成器方式返回整個檔案，節省記憶體
        resp = StreamingHttpResponse(FileWrapper(
            open(path, 'rb')), content_type=content_type)
        resp['Content-Length'] = str(size)
    resp['Accept-Ranges'] = 'bytes'
    return resp


def bilibili_get_title(request):
    url = request.GET['url']
    process = Popen('youtube-dl --get-thumbnail --get-title --get-duration \"' + url + '\"',
                    stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    error = False
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            r1 = re.search(r'ERROR:', line)
            output += line + '<br>'
            if r1 is not None:
                error = True
    if error:
        output = 'error.<br>' + output
    return HttpResponse(output)


def bilibili_download_thread(title, url, duration):
    process = Popen('youtube-dl -o \"' + MEDIA_ROOT + title + '.flv\" ' + url,
                    stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            output += line + '<br>'
            reg = re.search(r'\[download\]\s+(\d+\.?\d*)%\sof', line)
            if reg is not None:
                percent = open(MEDIA_ROOT + "message/" + title + '.txt', 'w')
                print(reg.group(1), file=percent, end='')
                percent.close()
    call('ffmpeg -y -i \"' + MEDIA_ROOT + title + '.flv\" -vcodec copy -acodec copy \"' + MEDIA_ROOT + title +
         '.mp4\"', stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    f = open(MEDIA_ROOT + "message/" + title + '.txt', 'w')
    if os.path.isfile(MEDIA_ROOT + title + '.mp4'):
        print('complete', file=f, end='<br>')
        clip = VideoFileClip(MEDIA_ROOT + title + '.mp4')
        print('%d:%.2f' % (clip.duration//60, clip.duration % 60), file=f, end='')
    else:
        print('failed', file=f, end='')
    f.close()


def bilibili_download(request):
    title = request.GET['title']
    url = request.GET['url']
    duration = request.GET['duration']
    thread = Thread(target=bilibili_download_thread,
                    args=(title, url, int(duration)))
    thread.start()
    return HttpResponse('')


def get_title(request):
    url = request.GET['url']
    process = Popen('youtube-dl --get-id --get-title -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4 \"' + url + '\"',
                    stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    error = False
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            r1 = re.search(r'ERROR:', line)
            r2 = re.search(r'WARNING:', line)
            if r2 is None:
                output += line + '<br>'
            if r1 is not None:
                error = True
    if error:
        output = 'error.<br>' + output
    return HttpResponse(output)


def download_thread(title, url):
    process = Popen('youtube-dl -o \"' + MEDIA_ROOT + title + '.mp4\" -f bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4 ' + url,
                    stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            output += line + '<br>'
            reg = re.search(r'\[download\]\s+(\d+\.?\d*)%\sof', line)
            if reg is not None:
                percent = open(MEDIA_ROOT + "message/" + title + '.txt', 'w')
                print(reg.group(1), file=percent, end='')
                percent.close()
    f = open(MEDIA_ROOT + "message/" + title + '.txt', 'w')
    if os.path.isfile(MEDIA_ROOT + title + '.mp4'):
        print('complete', file=f, end='<br>')
        clip = VideoFileClip(MEDIA_ROOT + title + '.mp4')
        print('%d:%.2f' % (clip.duration//60, clip.duration % 60), file=f, end='')
    else:
        print('failed', file=f, end='')
    f.close()


def download(request):
    title = request.GET['title']
    url = request.GET['url']
    thread = Thread(target=download_thread, args=(title, url))
    thread.start()
    return HttpResponse('')


def mp3cut_thread(title, start, end):
    process = Popen('ffmpeg -y -i \"' + MEDIA_ROOT + title + '.mp4\" -ss ' + start + ' -to ' + end + ' \"' + MEDIA_ROOT + title +
                    '_mp3cut_' + start + '_' + end + '.mp3\"', stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            output += line + '<br>'
            reg = re.search(r'time=(\d\d):(\d\d):(\d\d\.\d\d)\s', line.strip())
            if reg is not None:
                percent = (float(reg.group(1)) * 3600 + float(reg.group(2))
                           * 60 + float(reg.group(3))) * 100 / (float(end) - float(start))
                f = open(MEDIA_ROOT + "message/" + title + '_mp3cut_' +
                         start + '_' + end + '.txt', 'w')
                if (percent >= 100):
                    f.write('100')
                else:
                    f.write('%.2f' % percent)
                f.close()
    f = open(MEDIA_ROOT + "message/" + title + '_mp3cut_' +
             start + '_' + end + '.txt', 'w')
    f.write('complete')
    f.close()


def mp3cut(request):
    title = request.GET['title']
    start = request.GET['start']
    end = request.GET['end']
    thread = Thread(target=mp3cut_thread, args=(title, start, end))
    thread.start()
    return HttpResponse('')


def mp4cut_thread(title, start, end):
    process = Popen('ffmpeg -y -i \"' + MEDIA_ROOT + title + '.mp4\" -ss ' + start + ' -to ' + end + ' -acodec copy \"' + MEDIA_ROOT + title +
                    '_mp4cut_' + start + '_' + end + '.mp4\"', stdout=PIPE, stderr=STDOUT, shell=True, universal_newlines=True, encoding="utf-8")
    output = ''
    while True:
        line = process.stdout.readline()
        if not line:
            break
        else:
            line = line.strip()
            output += line + '<br>'
            reg = re.search(r'time=(\d\d):(\d\d):(\d\d\.\d\d)\s', line.strip())
            if reg is not None:
                percent = (float(reg.group(1)) * 3600 + float(reg.group(2))
                           * 60 + float(reg.group(3))) * 100 / (float(end) - float(start))
                f = open(MEDIA_ROOT + "message/" + title + '_mp4cut_' +
                         start + '_' + end + '.txt', 'w')
                if (percent >= 100):
                    f.write('100')
                else:
                    f.write('%.2f' % percent)
                f.close()
    f = open(MEDIA_ROOT + "message/" + title + '_mp4cut_' +
             start + '_' + end + '.txt', 'w')
    f.write('complete')
    f.close()


def mp4cut(request):
    title = request.GET['title']
    start = request.GET['start']
    end = request.GET['end']
    thread = Thread(target=mp4cut_thread, args=(title, start, end))
    thread.start()
    return HttpResponse('')


def bilibili(request):
    return render(request, 'bilibili.html')


def index(request):
    if 'url' in request.GET:
        url = request.GET['url']
        return render(request, 'index.html', {'url': url})
    else:
        return render(request, 'index.html')