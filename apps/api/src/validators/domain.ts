import { z } from "zod";

// Reasonably strict hostname validation — labels of letters/digits/hyphens,
// at least one dot, no leading/trailing hyphen per label.
const HOSTNAME_REGEX =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

export const addDomainBodySchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HOSTNAME_REGEX, "Enter a valid domain, e.g. app.example.com"),
});

export const domainIdParamsSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  domainId: z.string().trim().min(1, "Domain ID is required"),
});

export type AddDomainBody = z.infer<typeof addDomainBodySchema>;
export type DomainIdParams = z.infer<typeof domainIdParamsSchema>;
