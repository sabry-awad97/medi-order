import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettings, useUpdateSettings, useResetSettings } from "@/hooks";
import db from "@/lib/db";
import { mockSettings } from "@/test/mockData";

vi.mock("@/lib/db");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/settings-definitions", () => ({
  getAllDefaultValues: vi.fn(() => mockSettings),
  SETTINGS_DEFINITIONS: [],
}));

describe("useSettings", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch settings", async () => {
    const settingsArray = Object.entries(mockSettings).map(([key, value]) => ({
      id: key,
      key,
      value,
      updatedAt: new Date(),
    }));

    vi.mocked(db.settings.getAll).mockResolvedValue(settingsArray);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pharmacyName).toBe("صيدلية الاختبار");
  });
});
