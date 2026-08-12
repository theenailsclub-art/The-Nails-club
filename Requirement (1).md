 # Requirements Document

## 1. Application Overview

**Application Name**: The Nails Club Admin Dashboard

**Description**: A premium, elegant, responsive admin dashboard UI for The Nails Club e-commerce website (https://thenailsclub.in/). This is a frontend prototype designed to look production-ready, with mock data and no real backend integration. The dashboard enables administrators to manage products, orders, customers, analytics, marketing campaigns, and store settings.

## 2. Users and Usage Scenarios

**Target Users**: Store administrators and managers of The Nails Club

**Core Usage Scenarios**:
- Monitor business performance through key metrics and analytics
- Manage product catalog (add, edit, archive products)
- Process and track customer orders
- View and manage customer information
- Create and manage marketing campaigns and discount codes
- Configure store settings and integrations

## 3. Page Structure and Functionality

### 3.1 Page Structure

```
Admin Dashboard
├── Sidebar Navigation
│   ├── Brand Logo/Name
│   ├── Overview
│   ├── Products
│   ├── Orders
│   ├── Customers
│   ├── Analytics
│   ├── Marketing
│   ├── Settings
│   └── User Avatar/Profile
└── Main Content Area
    ├── Overview Page
    ├── Products Page
    ├── Orders Page
    ├── Customers Page
    ├── Analytics Page
    ├── Marketing Page
    └── Settings Page
```

### 3.2 Sidebar Navigation

**Components**:
- Brand logo/name at top
- Navigation menu items: Overview, Products, Orders, Customers, Analytics, Marketing, Settings
- User avatar/profile at bottom

**Functionality**:
- Highlight active section
- Collapse to icon-only view on mobile/tablet
- Smooth transitions between sections
- Clicking nav items switches visible page content

### 3.3 Overview Page (Dashboard Home)

**Components**:
- Welcome message displaying admin name
- Key metrics cards: Total Revenue, Total Orders, New Customers, Conversion Rate (each with trend indicator showing percentage change vs last period)
- Revenue chart (line/area chart) showing last 30 days with mock data
- Recent orders table displaying last 5-10 orders with: Order ID, Customer Name, Product, Amount, Status Badge
- Top selling products section with mini product cards showing: Image placeholder, Product name, Units sold
- Quick action buttons: Add Product, View Orders, Create Discount

**Functionality**:
- Display summary metrics and trends
- Visualize revenue over time
- Provide quick access to recent orders
- Show top performing products
- Enable quick actions through button shortcuts

### 3.4 Products Page

**Components**:
- Page header with \"Products\" title and \"Add New Product\" button
- Filter/search bar with: Search by name, Filter by category, Filter by status (Active/Draft/Archived)
- Product display area with Grid/List view toggle
- Product cards (Grid view) showing: Product image placeholder, Product name, Price, Stock count, Status badge, Edit and Delete buttons
- Pagination controls
- Add/Edit Product Modal or Slide-over panel

**Add/Edit Product Form Fields**:
- Product Name
- Description
- Price
- Compare-at Price
- Stock Quantity
- Category (dropdown)
- Status
- Image Upload placeholder
- Tags

**Functionality**:
- Search products by name
- Filter products by category and status
- Toggle between Grid and List view
- Add new product via modal/panel
- Edit existing product details
- Delete products
- Navigate through product pages

### 3.5 Orders Page

**Components**:
- Page header with \"Orders\" title
- Filter tabs: All, Pending, Processing, Shipped, Delivered, Cancelled
- Search bar and date range filter
- Orders table with columns: Order ID, Customer, Date, Items, Total, Payment Status, Fulfillment Status, Actions
- Order Detail side panel

**Order Detail Panel Contents**:
- Order summary
- Customer information
- Items ordered with thumbnails
- Shipping address
- Payment details
- Order timeline/history
- Action buttons (Mark as Shipped, Cancel Order, etc.)

**Status Badge Colors**:
- Pending: yellow
- Processing: blue
- Shipped: purple
- Delivered: green
- Cancelled: red

**Functionality**:
- Filter orders by status tabs
- Search orders
- Filter by date range
- View order details in side panel
- Update order status
- Cancel orders

### 3.6 Customers Page

**Components**:
- Page header with \"Customers\" title
- Summary stats cards: Total Customers, New This Month, Returning Customers, Average Order Value
- Search and filter bar
- Customers table with columns: Avatar, Name, Email, Total Orders, Total Spent, Last Order Date, Status, Actions
- Customer detail side panel

**Customer Detail Panel Contents**:
- Profile information
- Order history list
- Total spend
- Notes section

**Functionality**:
- View customer summary statistics
- Search and filter customers
- View customer details in side panel
- Access customer order history

### 3.7 Analytics Page

**Components**:
- Date range selector (Last 7 days, 30 days, 90 days, Custom)
- Revenue Overview chart (area chart)
- Orders Over Time chart (bar chart)
- Traffic Sources chart (donut/pie chart)
- Top Products table (ranked by revenue)
- Geographic breakdown (table or mock map placeholder)
- Conversion funnel stats

**Functionality**:
- Select date range for analytics data
- Visualize revenue trends
- Display order volume over time
- Show traffic source distribution
- Rank top performing products
- Display geographic customer distribution
- Show conversion funnel metrics

### 3.8 Marketing Page

**Components**:
- Discount Codes section with table showing: Code, Type (%, fixed), Value, Usage, Expiry, Status
- \"Create Discount\" button
- Email Campaigns section listing: Name, Status, Sent Date, Open Rate, Click Rate
- \"Create Campaign\" button
- Announcements/Banners section for homepage banner management

**Functionality**:
- View active and expired discount codes
- Create new discount codes via modal form
- View email campaign performance
- Create new email campaigns
- Manage homepage announcements and banners

### 3.9 Settings Page

**Components**:
- Tab navigation: Store Info, Account, Notifications, Integrations

**Store Info Tab**:
- Store name field
- Logo upload placeholder
- Currency selector
- Timezone selector
- Contact email field

**Account Tab**:
- Profile photo placeholder
- Name field
- Email field
- Change password form

**Notifications Tab**:
- Toggle switches for: New Order, Low Stock, New Customer, and other email notifications

**Integrations Tab**:
- Cards showing connected/disconnected services: Payment gateway, Shipping, Analytics, Email marketing

**Functionality**:
- Update store information
- Manage admin account details
- Configure notification preferences
- View integration status

## 4. Business Rules and Logic

### 4.1 Navigation Logic
- Single-page application behavior: clicking sidebar items switches visible content without page reload
- Active navigation item is highlighted
- Sidebar collapses to icon-only on mobile/tablet screens

### 4.2 Data Display Logic
- All data is mock/static (JSON objects in code)
- No real API calls or backend connections
- Trend indicators calculate percentage change vs previous period
- Status badges use color coding system: Pending=yellow, Processing=blue, Shipped=purple, Delivered=green, Cancelled=red

### 4.3 Filtering and Search Logic
- Products: filter by category and status, search by name
- Orders: filter by status tabs and date range, search functionality
- Customers: search and filter capabilities
- Analytics: date range selection affects displayed data

### 4.4 Modal and Panel Logic
- Modals and side panels open/close with smooth animations
- Clicking outside modal/panel or close button dismisses it
- Form submissions trigger mock toast notifications

### 4.5 Responsive Behavior
- Desktop: full sidebar visible, grid layouts use multiple columns
- Tablet: sidebar collapses to icons, grid layouts adjust column count
- Mobile: hamburger menu to toggle sidebar, single column layouts, tables may scroll horizontally

## 5. Exceptions and Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty product list | Display empty state with helpful message and \"Add Product\" button |
| No orders in selected filter | Show empty state with message |
| No customers yet | Display empty state with invitation message |
| Loading data | Show loading skeletons for data-heavy sections |
| Form validation errors | Display inline error messages below fields |
| Successful actions | Show toast notification (e.g., \"Product saved!\", \"Order updated!\") |
| Mobile navigation | Hamburger menu opens/closes sidebar overlay |
| Long product names | Truncate with ellipsis in card view |
| Large data tables | Implement pagination and horizontal scroll on mobile |

## 6. Acceptance Criteria

1. Admin opens dashboard and sees Overview page with welcome message, key metrics cards showing Total Revenue/Orders/Customers/Conversion Rate with trend indicators, revenue chart for last 30 days, recent orders table, and top selling products
2. Admin clicks Products in sidebar, sees product grid with image placeholders, names, prices, stock counts, status badges, and filter/search bar
3. Admin clicks \"Add New Product\" button, modal/panel opens with form fields (Name, Description, Price, Compare-at Price, Stock, Category, Status, Image Upload, Tags), fills form and saves, sees success toast notification
4. Admin clicks Orders in sidebar, sees orders table with filter tabs (All/Pending/Processing/Shipped/Delivered/Cancelled), clicks an order row, side panel opens showing order details, customer info, items with thumbnails, shipping address, payment details, and timeline
5. Admin clicks Customers in sidebar, sees summary stats and customers table with avatars, names, emails, total orders, total spent, clicks a customer row, side panel opens with profile info and order history
6. Admin clicks Analytics in sidebar, sees date range selector, revenue chart, orders chart, traffic sources chart, top products table, and geographic breakdown
7. Admin clicks Marketing in sidebar, sees discount codes table and email campaigns list, clicks \"Create Discount\" button, modal opens with discount form
8. Admin clicks Settings in sidebar, sees tabs (Store Info/Account/Notifications/Integrations), switches between tabs to view and update store settings, account details, notification preferences, and integration status

## 7. Out of Scope for This Release

- Real backend integration and API connections
- Database implementation
- User authentication and authorization system
- Real payment processing
- Real email sending functionality
- Real image upload and storage
- Real-time data updates
- Multi-user access control and permissions
- Data export functionality
- Advanced reporting and custom report builder
- Inventory management automation
- Customer segmentation tools
- A/B testing for marketing campaigns
- Multi-language support
- Dark mode toggle
- Accessibility features beyond basic requirements
- Print-friendly views
- Bulk operations (bulk edit, bulk delete)
- Advanced search with multiple filters
- Data import functionality
- Audit logs and activity tracking
- Mobile native app version
- Offline mode support
- Third-party integrations beyond mock display
- Automated email workflows
- Customer loyalty program management
- Gift card management
- Subscription management
- Refund and return processing
- Shipping label generation
- Tax calculation automation
- Multi-currency support beyond display
- Warehouse management
- Supplier management
- Purchase order management
- Barcode scanning
- POS integration
- Social media integration
- SEO management tools
- Content management system
- Blog management
- Review and rating moderation
- Live chat support integration
- Help desk ticketing system
- Knowledge base management
- Onboarding tutorials and tooltips
- Keyboard shortcuts
- Customizable dashboard widgets
- Saved filter presets
- Scheduled reports
- Webhook configuration
- API documentation viewer
- Developer tools and sandbox mode




