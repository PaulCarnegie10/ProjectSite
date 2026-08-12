---
# Bee Tracker — hand-written frontmatter. Comments and spacing here are a
# regression fixture: the edit server must not disturb any of it.
title: "Bee Tracker"
blurb: Computer vision for hive traffic     # shows on the card
date: "2025-06"

# tags use the block form on purpose
tags:
  - computer-vision
  - robotics
  -   embedded
order: 2                   # ascending sort on the Projects grid
draft: false
hero: "cover.png"
gallery: ["wide.png", "closeup.png"]
videos: ["demo.mp4"]
links:
  - { label: "GitHub", url: "https://github.com/example/bee-tracker" }
  - { label: "Poster", url: "./poster.pdf" }
---
# Bee Tracker

Counting bees at the hive entrance with a cheap camera and a Jetson.

```python
def count(frame):
    return len(detect(frame))
```

[TODO — Paul] write up the false-positive analysis.
