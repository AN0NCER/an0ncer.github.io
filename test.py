import youtube_dl

ydl_opts = {
    "format": "bestvideo[height<=720]"
}

with youtube_dl.YoutubeDL(ydl_opts) as ydl:
    info_dict = ydl.extract_info("https://www.youtube.com/watch?v=dwhnsV9yhZw", download=False)

# Print the video title
print(info_dict["url"])