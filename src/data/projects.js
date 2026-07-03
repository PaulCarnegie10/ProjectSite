// ─── Projects ───────────────────────────────────────────────────
// Single source of truth for the home-page slabs, the /projects index,
// and the /projects/:slug deep-dive pages.
//
// Home slab uses: index, slug, title, pitch, tags, side, accent.
// Deep dive adds: tagline, meta, sections, media, links.
// `media[].src` is relative to public/ — components prefix BASE_URL.

export const PROJECTS = [
  {
    index: 1,
    slug: 'terrain-mapper',
    title: 'Terrain Mapping Drone',
    pitch:
      'A hand-built drone carrying a Jetson Orin Nano and a Unitree L2 LiDAR — working toward mapping terrain and localizing from it, no GPS required.',
    tags: ['Robotics', 'LiDAR', 'Jetson', 'SolidWorks'],
    side: 'left',
    accent: 'rgba(183,140,255,0.22)',
    tagline:
      'Build the drone, solder every connection, tune it, fly it — then strap a LiDAR sensor package to it and teach it to know where it is from the shape of the ground.',
    meta: {
      timeframe: '2026',
      role: 'Solo build',
      status: 'In progress',
    },
    sections: [
      {
        heading: 'The build',
        body: [
          'Part one was putting my robotics and CS skills to work building the aircraft itself: assembling the frame, soldering all the electronics, tuning the flight controller, and getting it flying both autonomously and under manual control. That took about a week and a half of locking myself in my room.',
        ],
      },
      {
        heading: 'The sensor package',
        body: [
          'Part two is arguably much harder: setting up a Jetson Orin Nano, bringing up the Unitree L2 LiDAR, and 3D-modeling a full mounting system for the drone. The Jetson and LiDAR are up and capturing point clouds; the mounting system is in active development. I’m using SolidWorks with my 3D printer to rapidly prototype mount designs.',
        ],
      },
      {
        heading: 'End goal',
        body: [
          'Once the sensor package is flying, the first target is mapping a park. The end goal is localization from the terrain scans themselves — knowing where the drone is from the shape of the ground below it, without GPS.',
        ],
      },
    ],
    media: [],
    links: [],
  },
  {
    index: 2,
    slug: 'bee-tracker',
    title: 'BeeTracker',
    pitch:
      'A general-purpose autolabeling pipeline that turns raw bee-hive footage into trajectory data — YOLO detection, ByteTrack tracking, and an iterative loop that trains its own detector.',
    tags: ['Computer Vision', 'YOLO', 'ByteTrack', 'Research'],
    side: 'right',
    accent: 'rgba(255,110,199,0.22)',
    cover: 'projects/bee-tracker/hive-detections.png',
    tagline:
      'Research with Zeynep Temel’s lab at CMU: one researcher, raw hive video in, labeled trajectories out — in an afternoon instead of thousands of hand-drawn boxes.',
    meta: {
      timeframe: '2025 – 2026',
      role: 'Researcher · Temel Lab, CMU',
      status: 'Presented',
    },
    sections: [
      {
        heading: 'Where it started',
        body: [
          'This project began before I joined Zeynep Temel’s research team at CMU — it started at Cornell as Guadalupe Bernal’s Masters project, which produced hundreds of hours of bee-hive entrance footage. Hive-entrance video captures exactly what researchers need: foraging rate, traffic patterns, stress response. But raw footage is useless without labels, and training a reliable detector has traditionally meant hand-drawing thousands of bounding boxes per hive.',
          'My job was to collapse that pipeline: software that tracks bee trajectories, tells when bees enter and exit the hive, and can train new YOLO models inside the app so anyone with a different camera setup can adapt it to their own footage.',
        ],
      },
      {
        heading: 'Detection & tracking',
        body: [
          'Each frame passes through a fine-tuned YOLO detector. A ByteTrack layer links detections into persistent tracks, and a velocity-vector corrector recovers tracks missed between frames. Completed tracks are classified as entry, exit, or neither against a user-placed entrance zone, using a weighted score over displacement, velocity alignment, terminal proximity, and closest approach — with a dwell gate so a bee has to actually hang around the entrance to count.',
        ],
      },
      {
        heading: 'The autolabel loop',
        body: [
          'The core idea is an iterative loop that turns a text prompt into a fine-tuned bee detector: seed prompt → audit data → train → generate labels → analyze performance, where each pass improves the next round of labels. Mean IoU against reviewer-corrected ground truth holds at ~0.86 after the second iteration, and precision keeps rising as YOLO learns bee-specific cues.',
        ],
      },
      {
        heading: 'Results',
        body: [
          'On a 165-minute session the pipeline detected 24 entries and 44 exits, condensed into 143 navigable motion segments. Tracks export to CSV or JSON, and a manual-override UI handles the edge cases. The whole capture rig is just a camera, a stand, and a mesh enclosure at an outdoor apiary.',
          'The pipeline generalizes past bees — anything that crosses a boundary is fair game: ants at a nest, rats in a lab study, people walking through a doorway. Load a video, sketch an entrance, label a handful of frames, and the rest runs itself.',
        ],
      },
    ],
    media: [
      {
        type: 'video',
        src: 'projects/bee-tracker/demo-tracking.mp4',
        caption: 'Live tracking — YOLO detections with velocity-vector trajectory overlay',
      },
      {
        type: 'video',
        src: 'projects/bee-tracker/demo-full-pipeline.mp4',
        caption: 'Full desktop-app pipeline, from raw video to exported trajectories',
      },
      {
        type: 'image',
        src: 'projects/bee-tracker/hive-detections.png',
        caption: 'YOLO detections on live hive-entrance footage',
      },
      {
        type: 'image',
        src: 'projects/bee-tracker/trajectory-entry.png',
        caption: 'A completed track classified as an entry',
      },
      {
        type: 'image',
        src: 'projects/bee-tracker/trajectory-2.png',
        caption: 'Trajectory overlay on a motion segment',
      },
      {
        type: 'image',
        src: 'projects/bee-tracker/trajectory-3.png',
        caption: 'Orientation-flight path overlaid on the source frame',
      },
    ],
    links: [
      {
        label: 'Research poster (PDF)',
        href: 'projects/bee-tracker/beetracker-poster.pdf',
      },
    ],
  },
  {
    index: 3,
    slug: 'dr-wu-crew',
    title: 'Dr Wu Crew Autograder',
    pitch:
      'An autograder site that teaches the AP CSP curriculum — in-browser Python labs, per-objective autograding, and a full lesson-authoring flow, built by three high-school sophomores.',
    tags: ['Full-Stack', 'Python', 'EdTech'],
    side: 'left',
    accent: 'rgba(108,196,255,0.20)',
    cover: 'projects/dr-wu-crew/lab-editor.png',
    tagline:
      'Faculty picked three of us from our CS class to build a website that teaches the AP CSP curriculum. It was pretty much all of our first times making a website.',
    meta: {
      timeframe: 'High school · sophomore year',
      role: 'Co-developer (team of 3)',
      status: 'Shipped',
    },
    sections: [
      {
        heading: 'The assignment',
        body: [
          'Two classmates and I were selected by faculty to create an autograder-style website to teach students the AP Computer Science Principles curriculum. This was sophomore year of high school, and it was pretty much all of our first times making a website — so everything below was learned the hard way.',
        ],
      },
      {
        heading: 'What we built',
        body: [
          'The core is an in-window coding space that compiles Python, HTML, and CSS right in the browser. Each lesson pairs a video walkthrough with a lab: a checklist of autograded objectives (“correct modulo expression exists in the code”, “print the result of 2 to the 4th power”) that check off as the student’s code satisfies them.',
          'Around that we built Google sign-in, a database storing each student’s scores individually so progress persists across sessions, and an authoring flow that makes adding and editing lesson content easy for non-developers.',
        ],
      },
    ],
    media: [
      {
        type: 'image',
        src: 'projects/dr-wu-crew/lab-editor.png',
        caption: 'A Math lab — lesson video, live Python editor, console output, and autograded objectives',
      },
      {
        type: 'image',
        src: 'projects/dr-wu-crew/login.png',
        caption: 'Google sign-in, so every student’s lab progress is saved',
      },
      {
        type: 'image',
        src: 'projects/dr-wu-crew/lessons.png',
        caption: 'Lesson navigation',
      },
    ],
    links: [],
  },
];
