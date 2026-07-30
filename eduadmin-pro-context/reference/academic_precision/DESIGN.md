---
name: Academic Precision
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474e'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#500006'
  on-tertiary: '#ffffff'
  tertiary-container: '#79000e'
  on-tertiary-container: '#ff7a73'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 260px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for the high-stakes, data-intensive environment of school administration. It adopts a **Corporate / Modern** aesthetic, heavily influenced by high-performance productivity tools like Linear. The personality is authoritative yet accessible, prioritizing cognitive ease for administrators who manage complex schedules, student records, and financial data daily.

The visual language is characterized by extreme clarity, a monochromatic foundation punctuated by purposeful color, and a rigorous adherence to a functional grid. It avoids decorative flourishes, ensuring that the "UI fades into the background" so the data remains the primary focus. The emotional response is one of organized calm and institutional reliability.

## Colors
The palette is rooted in a professional Deep Navy (#1E3A5F), used for primary navigation and core branding elements to establish trust. The background uses a crisp Off-White (#F9FAFB) to reduce eye strain during long periods of use, while interactive surfaces are pure White (#FFFFFF).

- **Primary (Navy):** Used for the sidebar, primary action buttons, and active states.
- **Accent (Emerald):** Reserved for "Positive" outcomes—attendance marking, successful payments, and high-priority "Add" buttons.
- **Alert (Red):** Used sparingly for overdue tuition, student absences, or system errors.
- **Borders:** Subtle gray (#E5E7EB) defines the card-based structure without creating visual noise.

## Typography
The design system exclusively utilizes **Inter** for its exceptional legibility in data-heavy interfaces. The hierarchy is strictly enforced through weight and scale.

- **Headlines:** Use semi-bold and bold weights with tighter letter spacing for a modern, "tucked" look.
- **Body Text:** The standard size is 14px (body-md) to allow for high information density without sacrificing readability.
- **Labels:** Small, uppercase labels are used for table headers and section overviews to differentiate metadata from primary data.
- **Numerical Data:** Tabular figures should be enabled to ensure columns of numbers align perfectly in reports and rosters.

## Layout & Spacing
The layout employs a **Fluid Grid** with fixed-width constraints for the sidebar and maximum container widths. 

- **Sidebar:** A fixed 260px left-hand navigation allows for persistent access to modules (Students, Staff, Finance, Settings).
- **The "Canvas":** Content is housed in a main container with 32px of padding on all sides, ensuring the interface feels airy.
- **Card-Based Architecture:** Data is grouped into white cards. Spacing between cards is consistently 24px (lg).
- **Rhythm:** An 8px linear scale (using the 4px base) governs all internal component padding.
- **Mobile Adaptivity:** On mobile devices, the sidebar collapses into a bottom navigation bar or a hamburger menu, and 32px padding reduces to 16px.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Shadows** rather than heavy gradients. 

- **Level 0 (Background):** #F9FAFB (Flat).
- **Level 1 (Cards/Sidebar):** White surface with a `0 1px 3px 0 rgb(0 0 0 / 0.1)` shadow. This provides a "paper-on-table" feel.
- **Level 2 (Dropdowns/Modals):** Elevated with a more pronounced shadow (`0 10px 15px -3px rgb(0 0 0 / 0.1)`) to indicate temporary interaction.
- **Interaction:** Buttons use a very slight inner shadow on click to simulate physical depression.

## Shapes
The design system uses a **Rounded (8px)** corner radius as its standard. 

- **Cards & Input Fields:** 8px (standard roundedness) provides a modern, friendly feel while maintaining professional structure.
- **Buttons:** 6px (slightly tighter) to make them feel more "clickable" and distinct from layout containers.
- **Status Badges/Chips:** Fully pill-shaped to contrast against the rectangular grid of tables and cards.
- **Avatars:** Circular (100% rounded) to humanize the student and staff profiles.

## Components
- **Buttons:** Primary buttons are Navy (#1E3A5F) with white text. Success actions use Emerald (#10B981). All buttons use a 14px medium weight font.
- **Input Fields:** White background, 1px border (#E5E7EB). On focus, the border changes to Primary Navy with a subtle 2px outer glow.
- **Data Tables:** The workhorse of the system. Rows are 48px high, with light gray dividers. Headers use `label-sm` (uppercase, bold).
- **Status Chips:** Small badges with a light background and dark text (e.g., Emerald background at 10% opacity with Emerald text for "Paid").
- **Cards:** White containers with 24px internal padding. They should always have a subtle title in `headline-sm`.
- **Sidebar Items:** Clear, monochromatic icons (20px) paired with 14px medium-weight labels. The active state is indicated by a subtle background tint or a 3px left-border accent in Navy.
- **Dash-Stats:** Large numeric displays (display-lg) paired with a small trend indicator (e.g., "+2% from last month" in emerald).