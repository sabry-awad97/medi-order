# Item Inquiry Route Implementation

## Overview

Successfully implemented the "الاستعلام عن صنف" (Item Inquiry) route - a comprehensive search and lookup interface for inventory items.

## Route Information

- **Path**: `/inventory/item-inquiry`
- **English Name**: Item Inquiry
- **Arabic Name**: الاستعلام عن صنف
- **Purpose**: Advanced search and detailed item information lookup

## Architecture

### 1. Main Route Component

**File**: `apps/web/src/routes/inventory/item-inquiry/index.lazy.tsx`

**Features**:

- Three search types: Name, Barcode, Generic Name
- Quick access cards for common filters
- Real-time search results
- Integration with existing dialogs (ItemDetails, StockHistory, PriceHistory)
- Full RTL support

### 2. Components

#### SearchPanel (`search-panel.tsx`)

- **Purpose**: Main search interface with type selection
- **Features**:
  - Three search type buttons (Name, Barcode, Generic)
  - Search input with icon
  - Enter key support for quick search
  - Helpful search tips
  - Dynamic placeholder based on search type

#### QuickAccessCards (`quick-access-cards.tsx`)

- **Purpose**: Quick access to common inventory filters
- **Cards**:
  1. **Low Stock** (Yellow) - Items at or below minimum level
  2. **Out of Stock** (Red) - Items with zero quantity
  3. **Expiring Soon** (Orange) - Placeholder for future expiry tracking
  4. **High Value Items** (Green) - Top 20% by total value
- **Features**:
  - Color-coded cards with icons
  - Click to filter
  - Real-time statistics

#### SearchResults (`search-results.tsx`)

- **Purpose**: Display search results in detailed cards
- **Features**:
  - Comprehensive item information display
  - Stock status badges (In Stock, Low Stock, Out of Stock)
  - Four-column grid layout:
    - Stock information (quantity, min level)
    - Pricing (unit price, total value)
    - Manufacturer and form
    - Barcode and concentration
  - Action buttons:
    - View Details
    - Stock History
    - Price History
  - Empty states for no search and no results
  - Scrollable results area

### 3. Translations

#### English (`packages/i18n/src/locales/en/item-inquiry.json`)

- Complete translations for all UI elements
- Search tips and instructions
- Status labels and action buttons

#### Arabic (`packages/i18n/src/locales/ar/item-inquiry.json`)

- Full Arabic translations
- RTL-optimized text
- Cultural appropriateness

### 4. Navigation Integration

#### Sidebar Menu

- Added "Item Inquiry" / "الاستعلام عن صنف" to Inventory submenu
- Icon: FileText
- Position: Fourth item in Inventory section
- Auto-expands parent menu when active

## Key Features

### 1. Multi-Type Search

- **By Name**: Search item names (e.g., "Paracetamol")
- **By Barcode**: Search barcode numbers
- **By Generic Name**: Search generic/scientific names

### 2. Quick Access Filters

- One-click access to common inventory views
- Real-time statistics
- Visual indicators with color coding

### 3. Comprehensive Results

- Detailed item cards with all key information
- Stock status visualization
- Quick actions for deeper investigation

### 4. Dialog Integration

- Reuses existing dialogs from items route
- ItemDetailsDialog - Full item information with price history chart
- StockHistoryDialog - Stock adjustment history
- PriceHistoryDialog - Dedicated price history view

### 5. User Experience

- Search tips for better results
- Enter key support
- Empty states with helpful messages
- Responsive design
- Full RTL support for Arabic

## Technical Implementation

### Search Logic

```typescript
// Filters items based on search type
switch (searchType) {
  case "name":
    return item.name.toLowerCase().includes(query);
  case "barcode":
    return item.barcodes.some((b) => b.barcode.toLowerCase().includes(query));
  case "generic":
    return item.generic_name?.toLowerCase().includes(query) || false;
}
```

### Stock Status Calculation

```typescript
const getStockStatus = (quantity: number, minLevel: number) => {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= minLevel) return "low_stock";
  return "in_stock";
};
```

### High Value Items

- Calculates total value (quantity × unit price)
- Sorts by total value descending
- Returns top 20% of items

## Design Patterns

### 1. Consistent with Existing Routes

- Follows same structure as items and stock-adjustments routes
- Uses same Page components and layout
- Reuses existing dialogs and components

### 2. Component Separation

- Clear separation of concerns
- Reusable components
- Easy to maintain and extend

### 3. Type Safety

- Full TypeScript support
- Proper type definitions
- No diagnostics errors

### 4. Internationalization

- Registered in i18n configuration
- TypeScript type definitions updated
- Both English and Arabic translations

## Files Created

### Route Files

1. `apps/web/src/routes/inventory/item-inquiry/index.lazy.tsx`
2. `apps/web/src/routes/inventory/item-inquiry/-components/search-panel.tsx`
3. `apps/web/src/routes/inventory/item-inquiry/-components/quick-access-cards.tsx`
4. `apps/web/src/routes/inventory/item-inquiry/-components/search-results.tsx`
5. `apps/web/src/routes/inventory/item-inquiry/-components/index.ts`

### Translation Files

6. `packages/i18n/src/locales/en/item-inquiry.json`
7. `packages/i18n/src/locales/ar/item-inquiry.json`

### Modified Files

8. `packages/i18n/src/config/i18n-config.ts` - Added namespace registration
9. `packages/i18n/src/types/i18n.d.ts` - Added TypeScript types
10. `packages/i18n/src/locales/en/common.json` - Added menu item translation
11. `packages/i18n/src/locales/ar/common.json` - Added menu item translation
12. `apps/web/src/components/layout/app-sidebar.tsx` - Added menu item

## Future Enhancements

### 1. Expiry Date Tracking

- Add expiry_date field to inventory items
- Implement "Expiring Soon" filter
- Add expiry alerts

### 2. Advanced Filters

- Multiple simultaneous filters
- Date range filters
- Price range filters
- Manufacturer filter

### 3. Search History

- Save recent searches
- Quick access to previous searches
- Search suggestions

### 4. Export Functionality

- Export search results to CSV/Excel
- Print search results
- Generate reports

### 5. Barcode Scanner Integration

- Camera-based barcode scanning
- USB barcode scanner support
- Quick lookup via scan

## Testing Checklist

- [x] Route loads without errors
- [x] Search by name works correctly
- [x] Search by barcode works correctly
- [x] Search by generic name works correctly
- [x] Quick access cards display correct counts
- [x] Search results display properly
- [x] View Details dialog opens
- [x] Stock History dialog opens
- [x] Price History dialog opens
- [x] RTL layout works correctly
- [x] Arabic translations display properly
- [x] Empty states show correctly
- [x] Enter key triggers search
- [x] Navigation menu item works
- [x] No TypeScript errors

## Conclusion

The Item Inquiry route is a production-ready, feature-rich search interface that:

- Provides multiple search methods
- Offers quick access to common filters
- Displays comprehensive item information
- Integrates seamlessly with existing features
- Supports full internationalization
- Follows established design patterns
- Maintains code quality and type safety

This route enhances the inventory management system by providing pharmacists with a powerful tool to quickly find and review detailed information about any item in their inventory.
