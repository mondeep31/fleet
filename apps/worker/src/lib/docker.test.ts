import { describe, test, expect } from "vitest";
import { getDeploymentContainerName, getProjectContainerName } from "./docker";

describe("container naming", () => {
  test("getProjectContainerName returns legacy fixed name", () => {
    expect(getProjectContainerName("abc123")).toBe("fleet-project-abc123");
  });

  test("getDeploymentContainerName includes both projectId and deploymentId", () => {
    expect(getDeploymentContainerName("proj1", "deploy2")).toBe(
      "fleet-project-proj1-deploy2",
    );
  });

  test("deployment-scoped names for different deployments are distinct", () => {
    const a = getDeploymentContainerName("proj1", "deploy-v1");
    const b = getDeploymentContainerName("proj1", "deploy-v2");
    expect(a).not.toBe(b);
  });

  test("deployment-scoped name starts with the project prefix", () => {
    const name = getDeploymentContainerName("myproject", "dep123");
    expect(name.startsWith("fleet-project-myproject-")).toBe(true);
  });
});
