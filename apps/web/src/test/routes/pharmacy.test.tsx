import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import { mockOrders, mockSettings } from "@/test/mockData";
import type { Order } from "@/lib/types";

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
import {
  useOrders,
  useCreateOrder,
  useSettings,
  useSeedData,
  useClearData,
  useOrderAlerts,
} from "@/hooks";

// Import the component function directly
import { Route } from "@/routes/special-orders";

const SpecialOrdersComponent = Route.options.component!;

describe("Special Orders Page", () => {
  const mockCreateOrder = {
    mutate: vi.fn(),
  };

  const mockSeedData = {
    mutate: vi.fn(),
  };

  const mockClearData = {
    mutate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useOrderAlerts to do nothing
    vi.mocked(useOrderAlerts).mockReturnValue(undefined);

    vi.mocked(useSettings).mockReturnValue({
      data: mockSettings,
      isLoading: false,
    } as any);

    vi.mocked(useCreateOrder).mockReturnValue(mockCreateOrder as any);
    vi.mocked(useSeedData).mockReturnValue(mockSeedData as any);
    vi.mocked(useClearData).mockReturnValue(mockClearData as any);
  });

  it("should display loading state", () => {
    vi.mocked(useOrders).mockReturnValue({
      data: [] as any,
      isLoading: true,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

    expect(screen.getByText(/جاري تحميل الطلبات/)).toBeInTheDocument();
  });

  it("should display orders list", async () => {
    // Override settings to not filter by default
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, defaultOrderStatus: null as any },
      isLoading: false,
    } as any);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

    await waitFor(() => {
      expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
      expect(screen.getByText("فاطمة علي")).toBeInTheDocument();
    });
  });

  it("should display empty state when no orders", () => {
    // Override settings to not filter by default
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, defaultOrderStatus: null as any },
      isLoading: false,
    } as any);

    vi.mocked(useOrders).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

    expect(screen.getByText(/لا توجد طلبات/)).toBeInTheDocument();
    expect(screen.getByText(/ابدأ بإضافة طلب جديد/)).toBeInTheDocument();
  });

  it("should display statistics cards", async () => {
    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

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
      isError: false,
    });

    render(<SpecialOrdersComponent />);

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
      isError: false,
    });

    render(<SpecialOrdersComponent />);

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

    // Override settings to not filter by default
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, defaultOrderStatus: null as any },
      isLoading: false,
    } as any);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

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
    } as any);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

    expect(screen.getByText(/بيانات تجريبية/)).toBeInTheDocument();
    expect(screen.getByText(/حذف الكل/)).toBeInTheDocument();
  });

  it("should not show dev mode buttons when disabled", () => {
    vi.mocked(useSettings).mockReturnValue({
      data: { ...mockSettings, enableDevMode: false },
      isLoading: false,
    } as any);

    vi.mocked(useOrders).mockReturnValue({
      data: mockOrders,
      isLoading: false,
      isError: false,
    });

    render(<SpecialOrdersComponent />);

    expect(screen.queryByText(/بيانات تجريبية/)).not.toBeInTheDocument();
  });
});
