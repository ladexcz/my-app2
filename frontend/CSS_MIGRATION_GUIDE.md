/**
 * CSS REFACTORING GUIDE
 * How to use the new separated CSS structure
 */

// ============================================================================
// OPTION 1: Using Global Utility Classes (Recommended for simple components)
// ============================================================================

// Before (all inline):
function ButtonExample() {
  return <button className="rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]">
    Click me
  </button>;
}

// After (using globals):
function ButtonExample() {
  return <button className="btn-primary">Click me</button>;
}

// ============================================================================
// OPTION 2: Using CSS Modules (For organized, complex components)
// ============================================================================

// ProductCard.tsx - Before (messy inline):
function ProductCardBefore() {
  return (
    <article className="rounded-3xl border border-[#D8D3BC] bg-[#F8F4E2] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-40 w-full overflow-hidden rounded-[1.75rem] bg-[#F1F1E5]">
        <Image src={image} alt={title} fill className="object-cover" unoptimized />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1B1B1B]">{title}</h3>
          {owner ? <p className="mt-1 text-sm text-[#4F4F4F]">By {owner}</p> : null}
          <p className="mt-1 text-sm text-[#4F4F4F]">{subtitle}</p>
        </div>
        {badge ? <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D32]">{badge}</span> : null}
      </div>
      <button className="mt-5 w-full rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]">
        {actionLabel}
      </button>
    </article>
  );
}

// ProductCard.tsx - After (using CSS modules):
import styles from '@/styles/ProductCard.module.css';

function ProductCardAfter() {
  return (
    <article className={styles.card}>
      <div className={styles.image}>
        <Image src={image} alt={title} fill className={styles.imageWrapper} unoptimized />
      </div>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {owner ? <p className={styles.owner}>By {owner}</p> : null}
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {badge ? <span className="badge-gold">{badge}</span> : null}
      </div>
      <button className={styles.button}>{actionLabel}</button>
    </article>
  );
}

// ============================================================================
// Quick Reference: Available Global Classes
// ============================================================================

/*
CARDS:
  .card-base       - Default card with border and shadow
  .card-white      - White background card
  .card-product    - Product listing with hover effect

BUTTONS:
  .btn-primary     - Green primary button
  .btn-secondary   - Light green secondary
  .btn-small       - Small rounded button
  .btn-remove      - Remove/delete action

INPUTS:
  .input-base      - Standard input with focus effects
  .input-light     - Light background input

TEXT:
  .text-label      - Form label text
  .text-hint       - Helper/hint text
  .text-small      - Small text
  .text-badge      - Badge-style text

BADGES:
  .badge-primary   - Green success badge
  .badge-gold      - Gold/warning badge
  .badge-green     - Green variant
  .badge-info      - Info badge

ALERTS:
  .alert-success   - Floating success alert
  .alert-error     - Error alert
  .alert-info      - Info alert

LAYOUT:
  .container-max   - Max-width container
  .grid-2col       - 2-column responsive grid
  .grid-3col       - 3-column responsive grid

IMAGES:
  .image-container    - Standard image wrapper
  .image-cart-item    - Smaller cart item image
*/

// ============================================================================
// MIGRATION EXAMPLES
// ============================================================================

// Example 1: Simple Button
// Before:
<button className="rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]">
  Save
</button>

// After (any of these work):
<button className="btn-primary">Save</button>


// Example 2: Form Section
// Before:
<div className="rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-[#1B1B1B]">Form Title</h3>
  <p className="mt-2 text-sm text-[#4F4F4F]">Description</p>
  <input className="w-full rounded-3xl border border-[#D8D3BC] bg-white px-4 py-3 text-sm text-[#1B1B1B] outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#A5D6A7]" />
</div>

// After:
<div className="card-base">
  <h3 className="text-lg font-semibold text-[#1B1B1B]">Form Title</h3>
  <p className="mt-2 text-hint">Description</p>
  <input className="input-base" />
</div>


// Example 3: Alert Messages
// Before:
<div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full border border-emerald-200 bg-[#EBF7E4] px-5 py-3 text-sm font-semibold text-[#1B5E20] shadow-lg shadow-emerald-200/30 transition-all duration-300">
  Success message
</div>

// After:
<div className="alert-success">Success message</div>
