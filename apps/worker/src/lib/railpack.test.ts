import { describe, test, expect, vi, beforeEach } from "vitest";

const mockAccess = vi.fn();
const mockMkdir = vi.fn();
const mockInspect = vi.fn();
const mockStart = vi.fn();
const mockCreateContainer = vi.fn();
const mockGetImageInspect = vi.fn();
const mockPull = vi.fn();
const mockFollowProgress = vi.fn();

vi.mock("fs-extra", () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
}));

vi.mock("./docker", () => ({
  getDocker: () => ({
    getContainer: () => ({
      inspect: mockInspect,
      start: mockStart,
    }),
    createContainer: mockCreateContainer,
    getImage: () => ({
      inspect: mockGetImageInspect,
    }),
    pull: mockPull,
    modem: {
      followProgress: mockFollowProgress,
    },
  }),
}));

import { ensureBuildKit, ensureRailpackBin, getRailpackBinDir } from "./railpack";

describe("getRailpackBinDir", () => {
  test("defaults to ~/.fleet/bin", () => {
    expect(getRailpackBinDir()).toMatch(/\.fleet\/bin$/);
  });
});

describe("ensureRailpackBin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    delete process.env.RAILPACK_VERSION;
  });

  test("returns existing binary when executable", async () => {
    mockAccess.mockResolvedValue(undefined);

    const binPath = await ensureRailpackBin();
    expect(binPath).toBe(`${getRailpackBinDir()}/railpack`);
    expect(mockMkdir).not.toHaveBeenCalled();
  });
});

describe("ensureBuildKit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInspect.mockResolvedValue({ State: { Running: true } });
    mockGetImageInspect.mockResolvedValue({});
  });

  test("returns docker-container host when container is already running", async () => {
    const host = await ensureBuildKit();
    expect(host).toBe("docker-container://fleet-buildkit");
    expect(mockCreateContainer).not.toHaveBeenCalled();
  });

  test("starts container when it exists but is stopped", async () => {
    mockInspect.mockResolvedValue({ State: { Running: false } });
    mockStart.mockResolvedValue(undefined);

    const host = await ensureBuildKit();
    expect(host).toBe("docker-container://fleet-buildkit");
    expect(mockStart).toHaveBeenCalled();
  });
});
