import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/test/utils";
import { mockOrders, mockSettings } from "@/test/mockData";
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { Order, OrderFormData } from "@/lib/types";
import type { Settings } from "@/lib/types-settings";

// Mock hooks
vi.mock("@/hooks", () => ({
  useOrders: vi.fn(),
  useCreateOrder: vi.fn(),
  useUpdateOrder: vi.fn(),
  useUpdateOrderStatus: vi.fn(),
  useOrderAlerts: vi.fn(),
  useSeedData: vi.fn(),
  useClearData: vi.fn(),
  useSettings: vi.fn(),
}));

// Import after mocking
import { useOrders, useCreateOrder, useSettings } from "@/hooks";
import { Route } from "@/routes/pharmacy";

const PharmacyComponent = Route.options.component!;

describe("Pharmacy Page", () => {
  const mockCreateOrder = {
    mutate: vi.fn(),
    isPending: false,
  } as unknown as UseMutationResult<Order, Error, OrderFormData>;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    } as unknown as UseQueryResult<Settings, Error>);

    vi.mocked(useCreateOrder).mockReturnValue(mockCreateOrder);
  });

  it("should display loading state", () => {
    vi.mocked(useOrders).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    expect(screen.getByText(/جاري تحميل الطلبات/)).toBeInTheDocument();
  });

  it("should display orders list", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    await waitFor(() => {
      expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
      expect(screen.getByText("فاطمة علي")).toBeInTheDocument();
    });
  });

  it("should display empty state when no orders", () => {
    vi.mocked(useOrders).mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    expect(screen.getByText(/لا توجد طلبات/)).toBeInTheDocument();
    expect(screen.getByText(/ابدأ بإضافة طلب جديد/)).toBeInTheDocument();
  });

  it("should display statistics cards", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    await waitFor(() => {
      expect(screen.getByText("إجمالي الطلبات")).toBeInTheDocument();
      // Use getAllByText since "قيد الانتظار" appears multiple times
      const pendingTexts = screen.getAllByText("قيد الانتظار");
      expect(pendingTexts.length).toBeGreaterThan(0);
    });
  });

  it("should open order form when clicking add button", async () => {
    const user = userEvent.setup();

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    const addButton = screen.getByText("إضافة طلب جديد");
    await user.click(addButton);

    await waitFor(() => {
      // Dialog title should appear
      expect(screen.getAllByText(/إضافة طلب جديد/).length).toBeGreaterThan(1);
    });
  });

  it("should filter orders by search query", async () => {
    const user = userEvent.setup();

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    const searchInput = screen.getByPlaceholderText(
      /ابحث باسم العميل أو الدواء/,
    );
    await user.type(searchInput, "أحمد");

    await waitFor(() => {
      expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
      expect(screen.queryByText("فاطمة علي")).not.toBeInTheDocument();
    });
  });

  it("should filter orders by status", async () => {
    const user = userEvent.setup();

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    // Find the select trigger button
    const selectTrigger = screen.getByText("تصفية حسب الحالة");
    await user.click(selectTrigger);

    // Wait for dropdown to open and select "ordered" status
    await waitFor(() => {
      const orderedOptions = screen.getAllByText("تم الطلب");
      // Click the option in the dropdown (not the one in the card)
      const dropdownOption = orderedOptions.find(
        (el) =>
          el.getAttribute("data-slot") === "select-item" ||
          el.closest('[role="option"]'),
      );
      if (dropdownOption) {
        user.click(dropdownOption);
      }
    });

    await waitFor(() => {
      expect(screen.getByText("فاطمة علي")).toBeInTheDocument();
      expect(screen.queryByText("أحمد محمد")).not.toBeInTheDocument();
    });
  });

  it("should show dev mode buttons when enabled", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, enableDevMode: true },
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Settings, Error>);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    expect(screen.getByText(/بيانات تجريبية/)).toBeInTheDocument();
    expect(screen.getByText(/حذف الكل/)).toBeInTheDocument();
  });

  it("should not show dev mode buttons when disabled", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, enableDevMode: false },
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Settings, Error>);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<Order[], Error>);

    renderWithRouter(<PharmacyComponent />);

    expect(screen.queryByText(/بيانات تجريبية/)).not.toBeInTheDocument();
  });
});
