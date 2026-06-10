import ProjectDeepDive from './ProjectDeepDive.jsx';

export default function TerrainMapper() {
  return (
    <ProjectDeepDive
      slot="01"
      title="Terrain Mapper"
      tagline="Real content lands here once you supply it. Placeholder tagline meanwhile."
      sections={[
        {
          heading: 'Problem',
          body: 'Placeholder — describe the problem this project addresses. Pulled from your notes later.',
        },
        {
          heading: 'Approach',
          body: 'Placeholder — your method, the system architecture, the key choices.',
        },
        {
          heading: 'Results',
          body: 'Placeholder — what worked, numbers, screenshots/videos when they exist.',
        },
      ]}
    />
  );
}
