# Editing the site

You edit this site by running it on your own machine and clicking on things.
There's no CMS, no login, no admin panel on the internet. Everything you change
writes straight into `content/` as plain files, and you publish by committing
them.

The editing tools only exist when you run the site locally. They are stripped
out of the built site, so nothing on the public URL can be edited by anyone.

## Starting up

```bash
npm install     # first time only
npm run dev
```

Open the URL it prints (usually http://localhost:5173). That's the whole setup.

## The toggle

Bottom left corner, there's a small panel with an **Edit mode** switch. Off by
default. Flip it on and the editable parts of the page get a faint dashed
outline. Flip it off and the page looks exactly like the real thing.

`Ctrl+Shift+E` toggles it too. The setting is remembered, so if you turn it on
and come back tomorrow it's still on.

The panel also shows whether the edit server is awake and whether image and
video conversion are available.

## Text

With edit mode on, click any text. Short things (headings, titles, one liners)
turn into an editable box right where they sit. Type, then:

- **Enter** or click away saves it
- **Esc** throws the change away

Longer text (project write ups, the intro paragraph) opens a bigger box over
the top of it, because that text is markdown and you need room to see what
you're doing. Same deal there, except:

- **Ctrl+Enter** or click away saves it
- **Esc** throws the change away

Your change shows up right away. The page does not reload for text edits. If
the save fails for some reason, the text snaps back to what it was and you get
a message in the bottom right telling you why.

One thing to know about the long markdown boxes: after you save, the text shows
as plain markdown source instead of formatted. Refresh the page and it renders
properly again. Nothing is wrong, it just doesn't re-format until reload.

## Pictures

Drag an image file from your desktop onto any picture on the page.

- Dropping on the **main project picture** replaces it.
- Dropping on a **gallery** adds to it. Drop several at once if you want.

You'll see a progress bar while it uploads, then it converts the image and the
page reloads with the new picture in place.

Every image gets converted to `.webp` and shrunk so the longest side is at most
2000 pixels. You don't need to resize anything first. Drop the full size photo
straight off your phone or camera.

To take a picture out of a gallery, hover it with edit mode on and click the
little × in the corner. That only removes it from the project, the file itself
stays in the folder. If you change your mind, the file is still sitting there.

## Video

Same thing, drag an `.mp4` onto the videos area of a project.

Video is slower than pictures. A lot slower. The upload bar fills up quickly,
and then it switches to "compressing" with a timer counting up. That's the
video being re-encoded to H.264 and squeezed under 10 MB. A 90 MB clip takes a
few minutes.

**Leave the tab open while that timer is running.** If you close it or navigate
away, the encode is thrown out and you start over. There's a cancel link next
to the timer if you actually want to stop.

When it finishes the page reloads and the video is there.

## Projects

The bottom left panel has three buttons when edit mode is on.

**Add project.** Type a title, hit Create. It makes a new folder under
`content/projects/` named after the title, with an empty write up marked
`[TODO — Paul]`. It starts as a draft, so it won't show up on the live site
until you clear the draft flag. Fill it in, drop some pictures on it, done.

**Reorder.** Shows the projects in the order they currently appear. Push them
up and down, then Save order. This is what controls the order on the projects
page.

**Delete.** Pick a project, click Delete, then confirm. Nothing is actually
erased. The folder gets moved to `content/.trash/` with a timestamp on the
name. If you delete the wrong thing, drag the folder back out of `.trash` and
it's like it never happened.

Reorder and Delete read the project list off the page you're looking at, so do
those from a page that lists your projects.

## PDFs

You can't drag a PDF onto the page. Posters, papers, whatever, copy the file
into the project's folder yourself:

```
content/projects/bee-tracker/beetracker-poster.pdf
```

Then add a link to it in that project's `index.md`, in the `links` list:

```yaml
links:
  - { label: "Poster", url: "./beetracker-poster.pdf" }
```

The site turns that into a working link. Same goes for anything else you want
to hand out as a file.

## Publishing

Nothing you do locally is public until you push it. When you're happy:

```bash
git add content/
git commit -m "update bee tracker writeup"
git push
```

GitHub Actions builds the site and deploys it. Give it a minute or two, then
hard refresh the live page.

If you added pictures or video, `git add content/` picks those up too, since
they live in the project folders alongside the text.

## When something goes wrong

**"Edit server not running" in the corner panel, or nothing is clickable.**
The page is open but `npm run dev` isn't. Start it, then reload the page. This
also happens if you left a tab open overnight and the dev server got killed.

**Nothing has a dashed outline.** Edit mode is off. Bottom left switch, or
`Ctrl+Shift+E`.

**"Unsupported file type" when you drop something.** It's not an image or a
video. PDFs, zips, Word docs and so on get rejected on purpose. See the PDF
section above. Also check you're dropping a video onto the video area and a
picture onto a picture area, they don't mix.

**"Too large."** The file is over the size cap. For video, trim it before
dropping it. There's no point uploading a 10 minute clip that gets squeezed to
10 MB anyway, it'll look bad. Cut it down to the part you actually want to
show.

**The video has been "compressing" forever.** Check how long. A few minutes for
a big file is normal, and the timer counting up means it's still working. If
it's been much longer than that, hit cancel, and look at the terminal running
`npm run dev` for an error. Very long or very high resolution source files are
the usual cause. Trim it and try again.

**A text edit snapped back to the old wording.** The save failed and it told
you why in the bottom right corner. Most likely the dev server restarted
mid-edit. Reload the page and do it again.

**You edited something and the live site didn't change.** You didn't commit and
push, or Actions is still building. Check the Actions tab on GitHub.
