import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import { mockSuppliers, mockSettings } from "@/test/mockData";
import type { Supplier } from "@/lib/types";

// Mock hooks
vi.mock("@/hooks", () => ({
  useSuppliers: vi.fn(),
  useCreateSupplier: vi.fn(),
  useUpdateSupplier: vi.fn(),
  useDeleteSupplier: vi.fn(),
  useSeedData: vi.fn(),
  useClearData: vi.fn(),
  useSettings: vi.fn(),
}));

import { useSuppliers, useSettings, useSeedData, useClearData } from "@/hooks";
import { Route } from "@/routes/suppliers";

const SuppliersPage = Route.options.component!;

describe("Suppliers Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    } as any);

    vi.mocked(useSeedData).mockReturnValue({
      mutate: vi.fn(),
    } as any);

    vi.mocked(useClearData).mockReturnValue({
      mutate: vi.fn(),
    } as any);
  });

  it("should display loading state", () => {
    vi.mocked(useSuppliers).mockReturnValue({
      data: [] as any,
      isLoading: true,
      isError: false,
    });

    render(<SuppliersPage />);

    expect(screen.getByText(/جاري تحميل الموردين/)).toBeInTheDocument();
  });

  it("should display suppliers list", async () => {
    vi.mocked(useSuppliers).mockReturnValue({
      data: mockSuppliers,
      isLoading: false,
      isError: false,
    });

    render(<SuppliersPage />);

    await waitFor(() => {
      expect(screen.getByText("شركة الدواء المتحدة")).toBeInTheDocument();
      expect(screen.getByText("مؤسسة الصحة للأدوية")).toBeInTheDocument();
    });
  });

  it("should display empty state when no suppliers", () => {
    vi.mocked(useSuppliers).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<SuppliersPage />);

    expect(screen.getByText(/لا يوجد موردين/)).toBeInTheDocument();
  });

  it("should display statistics cards", async () => {
    vi.mocked(useSuppliers).mockReturnValue({
      data: mockSuppliers,
      isLoading: false,
      isError: false,
    });

    render(<SuppliersPage />);

    await waitFor(() => {
      expect(screen.getByText("إجمالي الموردين")).toBeInTheDocument();
      expect(screen.getByText("متوسط التقييم")).toBeInTheDocument();
    });
  });

  it("should filter suppliers by search query", async () => {
    const user = userEvent.setup();

    vi.mocked(useSuppliers).mockReturnValue({
      data: mockSuppliers,
      isLoading: false,
      isError: false,
    });

    render(<SuppliersPage />);

    const searchInput = screen.getByPlaceholderText(
      /ابحث باسم المورد أو رقم الهاتف أو الدواء/,
    );
    await user.type(searchInput, "الدواء");

    await waitFor(() => {
      expect(screen.getByText("شركة الدواء المتحدة")).toBeInTheDocument();
      expect(screen.queryByText("مؤسسة الصحة للأدوية")).not.toBeInTheDocument();
    });
  });
});
