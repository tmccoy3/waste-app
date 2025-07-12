# 🎯 Drag-and-Drop Dashboard Guide

## ✨ Overview

Your WasteOps Intelligence dashboard now includes **advanced drag-and-drop functionality** that allows you to completely customize the layout of your dashboard cards and sections while preserving all existing features and functionality.

## 🚀 Features

### ✅ **Complete Customization**
- Drag and drop any dashboard card to reposition it
- Rearrange cards within columns or move them between columns
- Full-width sections (Zone Map, Customer Dashboard) can also be repositioned
- Layout changes are automatically saved and restored on page reload

### ✅ **Preserved Functionality**
- **All existing features remain intact**: filters, search, maps, charts, real-time data
- **Data sources unchanged**: Still pulls from `geocoded_customers.json` (181 customers)
- **Interactive elements work**: Buttons, tooltips, dropdowns, and all user interactions
- **Role-based views**: Executive, Operations, and Sales views (when implemented)

### ✅ **Smart Layout System**
- **localStorage persistence**: Your layout preferences are saved per view type
- **Responsive design**: Works on desktop, tablet, and mobile devices
- **Visual feedback**: Clear drag handles and hover effects
- **Reset capability**: One-click return to default layout

## 🎮 How to Use

### 1. **Enable Layout Mode**
- Click the **"⚙️ Edit Layout"** button in the top-right corner
- The button turns green and shows **"✓ Done"** when active
- A helpful notification appears: *"Drag and drop cards to rearrange your dashboard"*

### 2. **Rearrange Cards**
- **Drag handles appear** at the top of each card when in layout mode
- **Click and drag** any card by its handle (dotted grip icon)
- **Drop the card** in your desired position
- Cards will **automatically snap** into place

### 3. **Save Your Layout**
- Changes are **automatically saved** to localStorage
- Your custom layout will **persist** across browser sessions
- Each view type (Executive/Operations/Sales) has its **own saved layout**

### 4. **Reset to Default**
- Click **"🔄 Reset Layout"** (appears when in layout mode)
- Instantly restores the original dashboard arrangement
- Useful if you want to start over with customization

### 5. **Exit Layout Mode**
- Click **"✓ Done"** to exit layout editing mode
- Drag handles disappear and normal dashboard interaction resumes
- Your layout changes are preserved

## 📋 Dashboard Cards Available for Customization

### **Left Column Cards**
1. **WasteOps Snapshot** - Business intelligence overview
2. **Recent Payments** - Transaction history and payment status

### **Center Column Cards**
3. **System Sync Health** - API integration status and sync progress
4. **Performance Overview** - Route efficiency and key metrics

### **Right Column Cards**
5. **Live Route Activity** - Real-time driver status and progress
6. **Revenue by Community** - Charts showing HOA performance

### **Full-Width Sections**
7. **Service Zone Overview** - Interactive Google Maps with zones
8. **Customer Operations Intelligence** - Executive dashboard with search/filters

## 🛠️ Technical Implementation

### **Libraries Used**
- **@dnd-kit/core** - Modern drag-and-drop framework
- **@dnd-kit/sortable** - Sortable item management
- **@dnd-kit/utilities** - CSS transform utilities

### **Key Components**
- **`DraggableDashboard`** - Main wrapper component with drag context
- **`DraggableCard`** - Individual card wrapper with sortable functionality
- **Layout persistence** via localStorage with view-specific keys

### **CSS Classes Added**
- `.draggable-dashboard` - Main container styling
- `.layout-mode` - Active editing mode styling
- `.draggable-item` - Individual card styling
- `.drag-handle` - Grip icon and drag area styling

## 📱 Mobile Support

### **Responsive Features**
- **Touch-friendly** drag handles on mobile devices
- **Larger touch targets** for easier interaction
- **Simplified layout controls** on smaller screens
- **Maintained functionality** across all device sizes

### **Mobile-Specific Behavior**
- Layout controls move to center on mobile
- Drag handles are larger for finger interaction
- Smooth animations optimized for touch devices

## 🔧 Customization Options

### **For Developers**
The drag-and-drop system is highly customizable:

```typescript
// Add new draggable cards
<DraggableCard id="my-custom-card" title="My Card" className="custom-card">
  <YourCustomComponent />
</DraggableCard>

// Customize layout categories
category: 'left' | 'center' | 'right' | 'full-width'

// Add custom drag constraints
activationConstraint: { distance: 8 }
```

### **CSS Customization**
```css
/* Customize drag handle appearance */
.drag-handle-icon {
  color: #your-brand-color;
}

/* Customize layout mode styling */
.layout-mode-item {
  border-color: #your-brand-color;
}
```

## 🎯 Best Practices

### **Layout Organization**
1. **Keep related cards together** - Group similar functionality
2. **Most important cards at top** - Place key metrics prominently
3. **Consider workflow** - Arrange cards in logical order of use
4. **Use full-width sections** for detailed views (maps, tables)

### **Performance Tips**
- Layout changes are **lightweight** and don't affect data loading
- **Minimal re-renders** - only dragged items update during drag
- **Optimized animations** for smooth 60fps performance

## 🚨 Troubleshooting

### **Common Issues**

**Layout not saving?**
- Check browser localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`

**Cards not dragging?**
- Ensure you're in "Edit Layout" mode
- Click and drag from the drag handle (dotted icon)
- Check that JavaScript is enabled

**Layout looks broken?**
- Click "Reset Layout" to restore defaults
- Refresh the page to reload CSS
- Check browser console for errors

### **Browser Support**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎉 What's Next?

### **Planned Enhancements**
- **Grid-based layouts** with snap-to-grid functionality
- **Multiple layout templates** (Compact, Detailed, Executive)
- **Export/Import layouts** to share configurations
- **Real-time collaboration** for team layout editing

### **Integration Opportunities**
- **Role-based default layouts** for different user types
- **Department-specific arrangements** (Operations vs Finance)
- **Seasonal layouts** that adapt to business cycles

---

## 📞 Support

For questions about the drag-and-drop functionality:
1. Check this guide first
2. Review the browser console for error messages
3. Try resetting the layout to defaults
4. Contact the development team with specific issues

**Enjoy your fully customizable dashboard!** 🎊 