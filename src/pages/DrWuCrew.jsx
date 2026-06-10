import ProjectDeepDive from './ProjectDeepDive.jsx';

export default function DrWuCrew() {
  return (
    <ProjectDeepDive
      slot="02"
      title="Dr Wu Crew"
      tagline="Real content lands here once you supply it. Placeholder tagline meanwhile."
      sections={[
        {
          heading: 'Problem',
          body: 'Placeholder — describe the problem this project addresses.',
        },
        {
          heading: 'Approach',
          body: 'Placeholder — your method and architecture.',
        },
        {
          heading: 'Results',
          body: 'Placeholder — outcomes and learnings.',
        },
      ]}
    />
  );
}
