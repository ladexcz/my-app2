// Tailwind CSS utility classes organized by component/pattern

// Colors
export const COLORS = {
  primary: "#2E7D32",
  primaryDark: "#256229",
  primaryLight: "#A3C593",
  secondary: "#F6F3E7",
  background: "#F5F5F5",
  border: "#D8D3BC",
  borderLight: "#E0E0E0",
  text: "#1B1B1B",
  textMuted: "#4F4F4F",
  success: "#E8F5E9",
  successText: "#2E7D32",
  successDark: "#256229",
  error: "rose-50",
  errorText: "rose-700",
};

// Common radius classes
export const RADIUS = {
  small: "rounded-[1.5rem]",
  medium: "rounded-[1.75rem]",
  large: "rounded-[2rem]",
  full: "rounded-full",
};

// Button classes
export const BUTTON = {
  primary: "rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229]",
  secondary: "rounded-3xl bg-[#A3C593] px-4 py-3 text-sm font-semibold text-[#1B1B1B] transition hover:bg-[#8CB67B]",
  small: "rounded-full bg-[#E0E0E0] px-3 py-1 text-sm font-semibold text-[#4F4F4F] hover:bg-[#D8D3BC]",
  remove: "rounded-3xl bg-[#E8F5E9] px-3 py-2 text-sm font-semibold text-[#256229] transition hover:bg-[#D1E8D2]",
};

// Card classes
export const CARD = {
  base: "rounded-[2rem] border border-[#E0E0E0] bg-[#F6F3E7] p-6 shadow-sm",
  white: "rounded-[2rem] border border-[#D8D3BC] bg-white p-6",
  product: "rounded-3xl border border-[#D8D3BC] bg-[#F8F4E2] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md",
};

// Input classes
export const INPUT = {
  base: "w-full rounded-3xl border border-[#D8D3BC] bg-white px-4 py-3 text-sm text-[#1B1B1B] outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#A5D6A7]",
  light: "w-full rounded-3xl border border-[#D8D3BC] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none",
};

// Text classes
export const TEXT = {
  label: "text-sm font-medium text-[#1B1B1B]",
  hint: "text-sm text-[#4F4F4F]",
  small: "text-xs text-[#4F4F4F]",
  muted: "text-sm text-[#4F4F4F]",
  heading: "text-lg font-semibold text-[#1B1B1B]",
  subheading: "text-2xl font-semibold text-[#1B1B1B]",
  badge: "text-sm uppercase tracking-[0.24em] text-[#2E7D32]",
};

// Badge classes
export const BADGE = {
  primary: "rounded-full bg-[#E8F5E9] px-3 py-1 text-sm font-semibold text-emerald-700",
  gold: "rounded-full bg-[#F9A825] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1B1B1B]",
  green: "rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2E7D32]",
  info: "rounded-full bg-[#F5F5F5] px-3 py-1 text-sm text-[#4F4F4F]",
};

// Image container classes
export const IMAGE = {
  container: "relative h-40 w-full overflow-hidden rounded-[1.75rem] bg-[#F1F1E5]",
  cartItem: "relative h-20 w-20 overflow-hidden rounded-[1.5rem] bg-[#F1F1E5]",
};

// Toast/Alert classes
export const ALERT = {
  success: "fixed left-1/2 top-24 z-50 -translate-x-1/2 rounded-full border border-emerald-200 bg-[#EBF7E4] px-5 py-3 text-sm font-semibold text-[#1B5E20] shadow-lg shadow-emerald-200/30 transition-all duration-300",
  error: "rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700",
  info: "rounded-3xl bg-[#E8F5E9] px-4 py-3 text-sm text-[#256229]",
};

// Layout classes
export const LAYOUT = {
  container: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
  grid2Col: "grid gap-5 lg:grid-cols-2",
  grid3Col: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
};
