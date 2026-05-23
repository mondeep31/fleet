import Project from "../db/models/project";

interface CreateProjectParams {
  name: string;
  repoUrl: string;
  userId: string;
}

interface GetAllProjectsForAUserParams {
  userId: string;
}

interface ProjectResponse {
  projectId: string;
  name: string;
  repoUrl: string;
  userId: string;
}

export const createProject = async ({
  name,
  repoUrl,
  userId,
}: CreateProjectParams) => {
  const project = await Project.create({ name, repoUrl, userId });
  return {
    id: project.projectId,
    name: project.name,
    repoUrl: project.repoUrl,
    userId: project.userId,
  };
};

export const getAllProjectsForAUser = async ({
  userId,
}: GetAllProjectsForAUserParams) => {
  const projects = await Project.find({ userId });
  return {
    projects: projects.map(
      (project): ProjectResponse => ({
        projectId: project.projectId,
        name: project.name,
        repoUrl: project.repoUrl,
        userId: project.userId,
      }),
    ),
  };
};
