function download_youtube() {
    var download_youtube_button = document.getElementById("download-youtube-button");
    var error_message = document.getElementById("error-message");
    var download_link = document.getElementById("download-link");
    download_youtube_button.disabled = true;
    download_youtube_button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i>Loading';
    var url = document.getElementById("url").value.replace(/list=.+/g, "");
    var get_title = new XMLHttpRequest();
    var title = "error.";
    var minute, second;
    get_title.open("get", "/get_title?url=" + url + "/");
    get_title.onload = function() {
        title = get_title.responseText.split("<br>")[0].replace(/\\/g, "").replace(/\//g, "").replace(/\?/g, "").replace(/\"/g, "").replace(/\|/g, "").replace(/\*/g, "").replace(/\</g, "").replace(/\>/g, "").replace(/\:/g, "").replace(/\#/g, "").replace(/\&/g, "").replace(/\+/g, "");;
        if (get_title.responseText.split("<br>")[0] == "error.") {
			alert("你輸入的影片網址不正確!");
			console.log(get_title.responseText.replace("error.<br>", ""));
            /*var output = get_title.responseText.replace("error.<br>", "");
            error_message.innerHTML = output;*/
            download_youtube_button.disabled = false;
            download_youtube_button.innerHTML = "開始下載";
        } else {
            error_message.innerHTML = "";
            var start_download = new XMLHttpRequest();
            document.getElementById("video-information-left").innerHTML = '<img src="' + get_title.responseText.split("<br>")[1] + '" height="144" width="256">'
            document.getElementById("video-title").innerHTML = title;
            document.getElementById("video-percent").innerHTML = "正在轉換 0.0 %";
            document.getElementById("video-progress").style.width = "0%";
            download_link.style.display = "none";
            document.getElementById("video-information").style.display = "block";
            start_download.open("get", "/download?title=" + title + "&url=" + url + "/");
            start_download.send();
            window.location.hash = "";
            window.location.hash = "#video-information";
        }
    };
    get_title.send();
    setTimeout(function() {
        var get_progress = setInterval(function() {
            if (title != "error.") {
                var get_percent = new XMLHttpRequest();
                get_percent.open("get", "/media/message/" + title + ".txt");
                get_percent.setRequestHeader("If-Modified-Since", "0");
                get_percent.onload = function() {
                    if (get_percent.status == 200) {
                        var video_progress = document.getElementById("video-progress");
                        var video_percent = document.getElementById("video-percent");
                        var output = get_percent.responseText;
                        if (output.split("<br>")[0] == "complete") {
                            var duration = output.split("<br>")[1];
                            minute = duration.split(":")[0];
                            second = duration.split(":")[1];
                            video_progress.style.width = "100%";
                            video_percent.innerHTML = "轉換完成  100 %";
                            download_link.style.display = "inline";
                            download_link.href = "/media/" + title + ".mp4";
                            var video = document.getElementById("video");
                            video.style.display = "block";
                            video.setAttribute("src", "/media/" + title + ".mp4");
                            clearInterval(get_progress);
                            download_youtube_button.disabled = false;
                            document.getElementById("start-minute").value = 0;
                            document.getElementById("start-second").value = 0;
                            document.getElementById("end-minute").value = minute;
                            document.getElementById("end-second").value = second;
                            document.getElementById("video-minute").value = minute;
                            document.getElementById("video-second").value = second;
                            document.getElementById("mp3cut").style.display = "none";
                            document.getElementById("mp4cut").style.display = "none";
                            document.getElementById("cut").style.display = "block";
                            download_youtube_button.innerHTML = "開始下載";
                            download_youtube_button.disabled = false;
                        } else if (output == "failed") {
                            clearInterval(get_progress);
                        }
                        if (output != "") {
                            video_progress.style.width = output + "%";
                            if (output.split("<br>")[0] != "complete") {
                                video_percent.innerHTML = "正在轉換  " + output + " %";
                            } else {
                                console.log(output);
                            }
                        }
                    }
                };
                get_percent.send();
            }
        }, 1000);
    }, 3000)
}

function search_youtube() {
    var search_button = document.getElementById("search-button");
    search_button.disabled = true;
    search_button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i>Loading';
    var search_text = document.getElementById("search-text").value;
    var output = "";
    var search = new XMLHttpRequest();
    search.open("get", "https://www.googleapis.com/youtube/v3/search?key=AIzaSyCmmkRL-vE3Q6CLkv00nn-l2JQqppcd8GA&part=snippet&type=video&maxResults=30&q=" + search_text);
    search.onload = function() {
        var response = JSON.parse(this.responseText);
        for (var i = 0; i < response.items.length; i++) {
            var item = response.items[i];
            var id = item.id.videoId;
            var title = item.snippet.title;
            //var imgurl = item.snippet.thumbnails.high.url;
            output += '<div id="video-information" style="display: block;"><div id="video-information-left">';
            output += '<img src="' + 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' + '" height="144" width="256">';
            output += '</div><div id="video-information-right"><span id="video-title">';
            output += title + '</span><br><a id="download-link" href="/?url=https://www.youtube.com/watch?v=' + id + '">點此下載</a></div></div>';
        }
        document.getElementById("search").innerHTML = output;
        search_button.innerHTML = "開始搜尋";
        search_button.disabled = false;
        window.location.hash = "";
        window.location.hash = "#search";
    };
    search.send();
}
window.onload = function() {
    if (document.getElementById("url").value != "") {
        document.getElementById("download-youtube-button").click();
    }
    document.getElementById("url").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("download-youtube-button").click();
        }
    });
    document.getElementById("search-text").addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("search-button").click();
        }
    });
}

function check_duration(startminute, startsecond, endminute, endsecond) {
    m1 = parseInt(startminute);
    s1 = parseFloat(startsecond);
    m2 = parseInt(endminute);
    s2 = parseFloat(endsecond);
    if ((m1 >= 0) && (s1 >= 0) && (m2 >= 0) && (s2 >= 0) && ((m1 * 60 + s1) <= (m2 * 60 + s2))) {
        return true;
    } else {
        alert("錯誤！請輸入正確的時間！");
        return false;
    }
}

function mp3cut() {
    var startminute = document.getElementById("start-minute").value.trim();
    var startsecond = document.getElementById("start-second").value.trim();
    var endminute = document.getElementById("end-minute").value.trim();
    var endsecond = document.getElementById("end-second").value.trim();
    if (check_duration(startminute, startsecond, endminute, endsecond)) {
        var start = (parseFloat(startminute) * 60 + parseFloat(startsecond)).toFixed(2);
        var end = (parseFloat(endminute) * 60 + parseFloat(endsecond)).toFixed(2);
        var mp3cut_button = document.getElementById("mp3cut-button");
        mp3cut_button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i>Loading';
        mp3cut_button.disabled = true;
        var title = document.getElementById("video-title").innerHTML;
        var mp3cut_percent = document.getElementById("mp3cut-percent");
        var mp3cut_progress = document.getElementById("mp3cut-progress");
        var mp3cut_download_link = document.getElementById("mp3cut-download-link");
        var mp3cut = document.getElementById("mp3cut");
        var mp3cut_request = new XMLHttpRequest();
        mp3cut_request.open("get", "/mp3cut?title=" + title + "&start=" + start + "&end=" + end);
        mp3cut_percent.innerHTML = "正在轉換 0.0 %";
        mp3cut_progress.style.width = "0%";
        mp3cut_download_link.style.display = "none";
        mp3cut.style.display = "block";
        mp3cut_request.send();
        setTimeout(function() {
            var get_progress = setInterval(function() {
                var get_percent = new XMLHttpRequest();
                get_percent.open("get", "/media/message/" + title + "_mp3cut_" + start + "_" + end + ".txt");
                get_percent.setRequestHeader("If-Modified-Since", "0");
                get_percent.onload = function() {
                    if (get_percent.status == 200) {
                        if (get_percent.responseText == "complete") {
                            mp3cut_percent.innerHTML = "轉換完成 100 %";
                            mp3cut_progress.style.width = "100%";
                            mp3cut_download_link.href = "/media/" + title + "_mp3cut_" + start + "_" + end + ".mp3";
                            mp3cut_download_link.style.display = "inline";
                            mp3cut_button.innerHTML = "開始截取 mp3";
                            mp3cut_button.disabled = false;
                            clearInterval(get_progress);
                        } else {
                            if (get_percent.responseText != "") {
                                mp3cut_percent.innerHTML = "正在轉換 " + get_percent.responseText + " %";
                                mp3cut_progress.style.width = get_percent.responseText + "%";
                            }
                        }
                    }
                }
                get_percent.send();
            }, 1000)
        }, 2000)
    }
}

function mp4cut() {
    var startminute = document.getElementById("start-minute").value.trim();
    var startsecond = document.getElementById("start-second").value.trim();
    var endminute = document.getElementById("end-minute").value.trim();
    var endsecond = document.getElementById("end-second").value.trim();
    if (check_duration(startminute, startsecond, endminute, endsecond)) {
        var start = (parseFloat(startminute) * 60 + parseFloat(startsecond)).toFixed(2);
        var end = (parseFloat(endminute) * 60 + parseFloat(endsecond)).toFixed(2);
        var mp4cut_button = document.getElementById("mp4cut-button");
        mp4cut_button.innerHTML = '<i class="fa fa-circle-o-notch fa-spin"></i>Loading';
        mp4cut_button.disabled = true;
        var title = document.getElementById("video-title").innerHTML;
        var mp4cut_percent = document.getElementById("mp4cut-percent");
        var mp4cut_progress = document.getElementById("mp4cut-progress");
        var mp4cut_download_link = document.getElementById("mp4cut-download-link");
        var mp4cut = document.getElementById("mp4cut");
        var mp4cut_request = new XMLHttpRequest();
        mp4cut_request.open("get", "/mp4cut?title=" + title + "&start=" + start + "&end=" + end);
        mp4cut_percent.innerHTML = "正在轉換 0.0 %";
        mp4cut_progress.style.width = "0%";
        mp4cut_download_link.style.display = "none";
        mp4cut.style.display = "block";
        mp4cut_request.send();
        setTimeout(function() {
            var get_progress = setInterval(function() {
                var get_percent = new XMLHttpRequest();
                get_percent.open("get", "/media/message/" + title + "_mp4cut_" + start + "_" + end + ".txt");
                get_percent.setRequestHeader("If-Modified-Since", "0");
                get_percent.onload = function() {
                    if (get_percent.status == 200) {
                        if (get_percent.responseText == "complete") {
                            mp4cut_percent.innerHTML = "轉換完成 100 %";
                            mp4cut_progress.style.width = "100%";
                            mp4cut_download_link.href = "/media/" + title + "_mp4cut_" + start + "_" + end + ".mp4";
                            mp4cut_download_link.style.display = "inline";
                            mp4cut_button.innerHTML = "開始截取 mp4";
                            mp4cut_button.disabled = false;
                            clearInterval(get_progress);
                        } else {
                            if (get_percent.responseText != "") {
                                mp4cut_percent.innerHTML = "正在轉換 " + get_percent.responseText + " %";
                                mp4cut_progress.style.width = get_percent.responseText + "%";
                            }
                        }
                    }
                }
                get_percent.send();
            }, 1000)
        }, 2000)
    }
}