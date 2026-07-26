import type { RequestHandler } from "express";
import {
  addCustomDomain,
  listDomainsForProject,
  refreshDomainStatus,
  removeCustomDomain,
} from "../services/domain";
import type { AddDomainBody, DomainIdParams } from "../validators/domain";
import type { ProjectIdParams } from "../validators/user";

export const addDomainController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { projectId } = req.params as unknown as ProjectIdParams;
  const { domain } = req.body as AddDomainBody;
  const created = await addCustomDomain(projectId, userId, domain);
  res.status(201).json({ success: true, message: "Domain added", data: created });
};

export const listDomainsController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { projectId } = req.params as unknown as ProjectIdParams;
  const domains = await listDomainsForProject(projectId, userId);
  res.json({ success: true, message: "Domains fetched", data: domains });
};

export const verifyDomainController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { projectId, domainId } = req.params as unknown as DomainIdParams;
  const domain = await refreshDomainStatus(projectId, userId, domainId);
  res.json({ success: true, message: "Domain status refreshed", data: domain });
};

export const deleteDomainController: RequestHandler = async (req, res) => {
  const userId = req.user!.userId;
  const { projectId, domainId } = req.params as unknown as DomainIdParams;
  await removeCustomDomain(projectId, userId, domainId);
  res.json({ success: true, message: "Domain removed", data: null });
};
