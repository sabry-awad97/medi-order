import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettings, useSetSetting } from "@/hooks";
import { mockSettings } from "@/test/mockData";

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
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Settings are now an array, so we need to find by key
    const pharmacyNameSetting = result.current.data?.find(
      (s) => s.key === "pharmacyName",
    );
    expect(pharmacyNameSetting?.value).toBe("صيدلية الاختبار");
  });
});
