# Testing Guide

This directory contains the testing setup and utilities for the Pharmacy Special Orders Management System.

## Testing Stack

- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM implementation for Node.js

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/test/
├── setup.ts              # Global test setup
├── utils.tsx             # Custom render functions
├── mockData.ts           # Mock data for tests
├── README.md             # This file
├── hooks/                # Hook tests
│   ├── use-orders.test.tsx
│   └── use-settings.test.tsx
├── components/           # Component tests
│   └── order-form.test.tsx
└── routes/               # Route/page tests
    ├── pharmacy.test.tsx
    └── suppliers.test.tsx
```

## Writing Tests

### Hook Tests

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useOrders } from "../use-orders";

it("should fetch orders", async () => {
  const { result } = renderHook(() => useOrders(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### Component Tests

```typescript
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { OrderForm } from "../order-form";

it("should submit form", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<OrderForm open onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText(/اسم العميل/), "أحمد");
  await user.click(screen.getByRole("button", { name: /إضافة/ }));

  expect(onSubmit).toHaveBeenCalled();
});
```

### Route Tests

```typescript
import { renderWithRouter } from "@/test/utils";
import PharmacyPage from "../pharmacy";

it("should display orders", async () => {
  renderWithRouter(<PharmacyPage />);

  await waitFor(() => {
    expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Use user-event over fireEvent**: Simulates real user interactions
2. **Query by accessibility**: Use `getByRole`, `getByLabelText` over `getByTestId`
3. **Wait for async updates**: Use `waitFor` for async operations
4. **Mock external dependencies**: Mock API calls, database, etc.
5. **Test user behavior**: Focus on what users see and do
6. **Keep tests isolated**: Each test should be independent
7. **Use descriptive test names**: Clearly state what is being tested

## Mocking

### Mocking Hooks

```typescript
vi.mock("@/hooks", () => ({
  useOrders: vi.fn(),
  useSettings: vi.fn(),
}));

// In test
vi.mocked(useOrders).mockReturnValue({
  data: mockOrders,
  isLoading: false,
});
```

### Mocking Database

```typescript
vi.mock("@/lib/db", () => ({
  default: {
    orders: {
      getAll: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests run automatically on:

- Pull requests
- Commits to main branch
- Before deployment

## Troubleshooting

### Tests timing out

- Increase timeout in `vitest.config.ts`
- Check for missing `await` statements

### Mock not working

- Ensure mock is defined before import
- Use `vi.clearAllMocks()` in `beforeEach`

### Component not rendering

- Check if all required props are provided
- Verify providers are wrapped correctly

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
