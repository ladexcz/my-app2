# Styling Architecture

This folder contains centralized CSS files for the Agricultural Marketplace frontend.

## Structure

### `globals.css`
**Global theme and Tailwind utilites**.
- CSS custom properties for colors
- Tailwind `@layer components` with reusable patterns
- Global button, card, input, badge, and alert styles
- Layout utilities (containers, grids)

### `ProductCard.module.css`
**Styles for the ProductCard component**.
- References global utility classes via `@apply`
- Provides semantic class names for the component structure

### `buyer.module.css`
**Styles for the Buyer page**.
- Organizes all buyer dashboard styles by section
- Uses global utility classes and custom layout patterns

### `producer.module.css`
**Styles for the Producer page**.
- Organizes producer studio styles by feature
- Form, inventory, and order management styles

## How to Use

### In Components (TypeScript/TSX)
```tsx
import styles from '@/styles/ProductCard.module.css';

export default function ProductCard() {
  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <Image ... />
      </div>
      <h3 className={styles.title}>Title</h3>
      <button className={styles.button}>Action</button>
    </article>
  );
}
```

### Using Global Utility Classes
For simple styling, import and use global classes directly in JSX:

```tsx
<button className="btn-primary">Click me</button>
<div className="card-base">Content</div>
<input className="input-base" />
```

### Tailwind with Utilities
Still use Tailwind className strings for responsive and unique styles:

```tsx
<div className="mt-4 sm:mt-6 lg:mt-8">Content</div>
```

## Color System
All colors are defined in `globals.css` as CSS custom properties:
- `--color-primary`: #2E7D32 (Green)
- `--color-secondary`: #F6F3E7 (Beige)
- `--color-background`: #F5F5F5
- `--color-text`: #1B1B1B
- `--color-text-muted`: #4F4F4F

## Available Global Classes

### Cards
- `.card-base` – Default card with border and shadow
- `.card-white` – White card background
- `.card-product` – Product listing card with hover effect

### Buttons
- `.btn-primary` – Green primary button
- `.btn-secondary` – Light green secondary button
- `.btn-small` – Small rounded button
- `.btn-remove` – Remove/delete action button

### Inputs
- `.input-base` – Standard input with focus ring
- `.input-light` – Light background input

### Text
- `.text-label` – Form label text
- `.text-hint` – Hint/helper text
- `.text-small` – Small text
- `.text-badge` – Badge-style text

### Badges
- `.badge-primary` – Green success badge
- `.badge-gold` – Gold/warning badge
- `.badge-green` – Green variant badge
- `.badge-info` – Info badge

### Alerts
- `.alert-success` – Success floating alert
- `.alert-error` – Error alert
- `.alert-info` – Info alert

### Layout
- `.container-max` – Max-width container with padding
- `.grid-2col` – 2-column responsive grid
- `.grid-3col` – 3-column responsive grid

### Images
- `.image-container` – Standard image container
- `.image-cart-item` – Smaller cart item image

## Benefits
✓ Cleaner JSX files – Less className clutter  
✓ Consistent styling – Single source of truth  
✓ Easy maintenance – Update styles in one place  
✓ Better organization – CSS separated from logic  
✓ Responsive design – Tailwind utilities still available  
