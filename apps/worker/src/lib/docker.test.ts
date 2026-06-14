import { describe, test, expect } from "vitest";
import {
  buildFleetLabels,
  getDeploymentContainerName,
  getProjectContainerName,
} from "./docker";

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

describe("buildFleetLabels", () => {
  test("sets fleet.managed to true", () => {
    const labels = buildFleetLabels("proj1", "dep1");
    expect(labels["fleet.managed"]).toBe("true");
  });

  test("embeds projectId and deploymentId", () => {
    const labels = buildFleetLabels("myproject", "mydeployment");
    expect(labels["fleet.project.id"]).toBe("myproject");
    expect(labels["fleet.deployment.id"]).toBe("mydeployment");
  });

  test("different deployments of the same project produce different deployment labels", () => {
    const a = buildFleetLabels("proj1", "dep-v1");
    const b = buildFleetLabels("proj1", "dep-v2");
    expect(a["fleet.deployment.id"]).not.toBe(b["fleet.deployment.id"]);
    expect(a["fleet.project.id"]).toBe(b["fleet.project.id"]);
  });
});
