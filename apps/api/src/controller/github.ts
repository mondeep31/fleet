import type { RequestHandler } from "express";
import { listGitHubRepos } from "../services/github";

export const listGitHubReposController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const repos = await listGitHubRepos({ userId });

  res.status(200).json({
    message: "GitHub repositories fetched successfully",
    success: true,
    data: { repos },
  });
};
