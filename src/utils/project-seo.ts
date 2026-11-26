import { siteConfig } from '../config/site';
import projects from '../data/projects.json';

type Project = typeof projects[number];
type ProjectType = 'SoftwareApplication' | 'SoftwareSourceCode' | 'WebApplication' | 'WebSite';

interface ProjectMetadata {
  type: ProjectType;
  alternateName?: string;
  officialUrl?: string;
}

const projectMetadata: Record<string, ProjectMetadata> = {
  parking: { type: 'WebApplication', alternateName: 'Parallel Parking Lab' },
  stock: { type: 'WebApplication' },
  shade: { type: 'WebApplication', alternateName: 'AR 妝容' },
  framecheck: {
    type: 'WebApplication',
    alternateName: 'Visual Regression Hub',
    officialUrl: 'https://visual-regression-hub.vercel.app/',
  },
  pixel: { type: 'WebApplication' },
  youbike: { type: 'WebApplication' },
  kanban: { type: 'WebApplication' },
  datetime: { type: 'SoftwareSourceCode' },
  'dev-map': { type: 'WebApplication' },
  toolbox: { type: 'WebApplication' },
  'mr-coding': { type: 'WebSite' },
  'mr-financial': { type: 'WebSite' },
  'auto-shutdown': { type: 'SoftwareApplication' },
  'web-auth': { type: 'SoftwareSourceCode' },
  'pair-practice': { type: 'WebApplication' },
  'markdown-reader': { type: 'SoftwareApplication' },
};

const papQc = {
  name: 'PAP 品管工作台',
  seriesId: 'pap-qc',
  publicUrl: 'https://ntustray.github.io/pap-qc-workbench/',
};

export function projectPageUrl(id: string, siteUrl: URL) {
  return new URL(`projects/${id}/`, siteUrl).href;
}

function projectId(project: Project, siteUrl: URL) {
  if (project.id === 'mr-coding') return `${siteUrl.href}#website`;
  if (project.id === 'mr-financial') return `${project.demo}#website`;
  return `${projectPageUrl(project.id, siteUrl)}#product`;
}

export function projectForSeries(seriesId: string | undefined, siteUrl: URL) {
  if (seriesId === papQc.seriesId) {
    return {
      '@type': 'WebApplication',
      '@id': `${new URL(`series/${papQc.seriesId}/`, siteUrl).href}#product`,
      name: papQc.name,
      url: papQc.publicUrl,
    };
  }
  const project = projects.find((item) => item.seriesId === seriesId);
  return project ? { '@id': projectId(project, siteUrl), name: project.name } : undefined;
}

export function projectEntity(project: Project, siteUrl: URL) {
  const metadata = projectMetadata[project.id];
  const id = projectId(project, siteUrl);
  if (project.id === 'mr-coding') return { '@id': id };

  const type = metadata.type;
  const packageUrl = project.links.find(({ label }) => label === 'npm')?.url;
  const url = metadata.officialUrl ?? packageUrl ?? project.demo ?? project.source ?? undefined;
  return {
    '@type': type,
    '@id': id,
    name: project.name,
    alternateName: metadata.alternateName,
    description: project.summary,
    url,
    image: new URL(project.image, siteUrl).href,
    inLanguage: siteConfig.locale,
    subjectOf: { '@id': new URL(`series/${project.seriesId}/`, siteUrl).href },
    ...(type === 'SoftwareSourceCode' && project.source && { codeRepository: project.source }),
    ...((type === 'WebApplication' || type === 'SoftwareApplication') && { featureList: project.features }),
  };
}
