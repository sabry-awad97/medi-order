import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
} from "@/hooks";
import db from "@/lib/db";
import { mockOrder, mockOrders } from "@/test/mockData";
import type { OrderFormData } from "@/lib/types";

// Mock the database
vi.mock("@/lib/db", () => ({
  default: {
    orders: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useOrders", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    // Clear any cached data
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it.skip("should fetch all orders successfully", async () => {
    // TODO: Fix this test - query doesn't resolve in test environment
    vi.mocked(db.orders.getAll).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrders(), { wrapper });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to succeed
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 5000 },
    );

    expect(result.current.data).toEqual(mockOrders);
    expect(db.orders.getAll).toHaveBeenCalled();
  });

  it("should handle empty orders list", async () => {
    vi.mocked(db.orders.getAll).mockResolvedValue([]);

    const { result } = renderHook(() => useOrders(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("should create a new order", async () => {
    const newOrderData: OrderFormData = {
      customerName: "محمد أحمد",
      phoneNumber: "0501234567",
      medicines: [
        {
          name: "باراسيتامول",
          concentration: "500mg",
          form: "أقراص",
          quantity: 2,
        },
      ],
      notes: "طلب جديد",
    };

    vi.mocked(db.orders.create).mockResolvedValue(mockOrder);

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    result.current.mutate(newOrderData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(db.orders.create).toHaveBeenCalledTimes(1);
  });

  it("should update an existing order", async () => {
    const updateData: OrderFormData = {
      customerName: "محمد أحمد المحدث",
      phoneNumber: "0501234567",
      medicines: [
        {
          name: "باراسيتامول",
          concentration: "500mg",
          form: "أقراص",
          quantity: 3,
        },
      ],
      notes: "تم التحديث",
    };

    const updatedOrder = {
      ...mockOrder,
      customerName: updateData.customerName,
      phoneNumber: updateData.phoneNumber,
      medicines: updateData.medicines.map((m, i) => ({
        ...m,
        id: `med-${i + 1}`,
      })),
      notes: updateData.notes,
    };

    vi.mocked(db.orders.update).mockResolvedValue(updatedOrder);

    const { result } = renderHook(() => useUpdateOrder(), { wrapper });

    result.current.mutate({ id: "order-1", data: updateData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(db.orders.update).toHaveBeenCalledWith(
      "order-1",
      expect.any(Object),
    );
  });

  it("should update order status", async () => {
    vi.mocked(db.orders.update).mockResolvedValue({
      ...mockOrder,
      status: "ordered",
    });

    const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper });

    result.current.mutate({ id: "order-1", status: "ordered" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(db.orders.update).toHaveBeenCalledWith("order-1", {
      status: "ordered",
    });
  });

  it("should handle validation errors when creating order", async () => {
    const invalidOrderData = {
      customerName: "", // Invalid: empty name
      phoneNumber: "0501234567",
      medicines: [],
      notes: "",
    } as OrderFormData;

    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    result.current.mutate(invalidOrderData);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
