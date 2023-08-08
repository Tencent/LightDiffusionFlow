import re

matchObj = re.match("data:image/[a-zA-Z0-9]+;base64,", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDA")
print(matchObj.group())
