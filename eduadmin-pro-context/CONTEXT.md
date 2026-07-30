# EduAdmin Pro — React Build Context

## Goal
Rebuild the attached Stitch export **exactly as designed** — same layout, same colors,
same spacing, same copy, same icons — as a working **React (Vite) app**. Do not
redesign, "improve," or reinterpret anything. The `reference/` folder next to this
file contains the original Stitch HTML/Tailwind output per screen — treat each
`code.html` as the pixel-accurate source of truth and port it to JSX 1:1.

Only React is in scope for this pass (no Flutter, no backend calls yet — use static/
mock data matching what's already in the reference HTML). Firebase/n8n wiring comes
in a later step once the UI is confirmed to match.

## Tech stack
- **Vite + React** (JavaScript, not TypeScript, unless you already have a TS project)
- **Tailwind CSS** — configured with the EXACT custom tokens below (this is a Material
  3–derived design system, not default Tailwind colors)
- **react-router-dom** for the 5 routes/screens
- **Google Material Symbols Outlined** font for all icons (already used throughout the
  reference HTML as `<span class="material-symbols-outlined">icon_name</span>`)
- **Inter** font (Google Fonts), weights 400/500/600/700
- No component library (shadcn/MUI/etc.) — everything is custom Tailwind, matching the
  reference exactly

## Design tokens (put these in tailwind.config.js `theme.extend`)

```js
colors: {
  surface: '#f8f9fa',
  'surface-dim': '#d9dadb',
  'surface-bright': '#f8f9fa',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f3f4f5',
  'surface-container': '#edeeef',
  'surface-container-high': '#e7e8e9',
  'surface-container-highest': '#e1e3e4',
  'on-surface': '#191c1d',
  'on-surface-variant': '#43474e',
  'inverse-surface': '#2e3132',
  'inverse-on-surface': '#f0f1f2',
  outline: '#74777f',
  'outline-variant': '#c4c6cf',
  'surface-tint': '#455f87',
  primary: '#022448',
  'on-primary': '#ffffff',
  'primary-container': '#1e3a5f',
  'on-primary-container': '#8aa4cf',
  'inverse-primary': '#adc8f5',
  secondary: '#006c49',
  'on-secondary': '#ffffff',
  'secondary-container': '#6cf8bb',
  'on-secondary-container': '#00714d',
  tertiary: '#500006',
  'on-tertiary': '#ffffff',
  'tertiary-container': '#79000e',
  'on-tertiary-container': '#ff7a73',
  error: '#ba1a1a',
  'on-error': '#ffffff',
  'error-container': '#ffdad6',
  'on-error-container': '#93000a',
  'primary-fixed': '#d5e3ff',
  'primary-fixed-dim': '#adc8f5',
  'on-primary-fixed': '#001c3b',
  'on-primary-fixed-variant': '#2d486d',
  'secondary-fixed': '#6ffbbe',
  'secondary-fixed-dim': '#4edea3',
  'on-secondary-fixed': '#002113',
  'on-secondary-fixed-variant': '#005236',
  'tertiary-fixed': '#ffdad7',
  'tertiary-fixed-dim': '#ffb3ad',
  'on-tertiary-fixed': '#410004',
  'on-tertiary-fixed-variant': '#930013',
  background: '#f8f9fa',
  'on-background': '#191c1d',
  'surface-variant': '#e1e3e4',
},
borderRadius: {
  DEFAULT: '0.25rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
},
spacing: {
  base: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  'sidebar-width': '260px',
  'container-max': '1440px',
},
fontFamily: {
  'body-lg': ['Inter'],
  'headline-sm': ['Inter'],
  'display-lg': ['Inter'],
  'label-md': ['Inter'],
  'body-md': ['Inter'],
  'label-sm': ['Inter'],
  'headline-md': ['Inter'],
},
fontSize: {
  'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'headline-sm': ['18px', { lineHeight: '28px', fontWeight: '600' }],
  'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
  'label-md': ['13px', { lineHeight: '18px', fontWeight: '500' }],
  'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
  'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
},
```

### Brand voice (for any new copy you must invent)
Corporate/Modern, Linear-inspired. Monochromatic base (navy #1E3A5F / off-white
#F9FAFB) punctuated by purposeful color: **Emerald = positive** (attendance present,
paid fees, success actions), **Red = alert** (overdue, absent, errors). No decorative
flourishes — the UI should "fade into the background" so data is the focus.

- Cards: white, 24px padding, 8px radius, `shadow-sm`, thin `outline-variant` border
- Buttons: 6px radius, navy primary / emerald success, 14px medium label font
- Status chips: fully pill-shaped, light tint background + matching dark text (e.g.
  emerald/10% bg + emerald text for "Paid")
- Data tables: 48px row height, light gray dividers, uppercase `label-sm` headers
- Sidebar nav: active item = primary-container background + on-primary-container text
  + 4px left border in primary color

## Global layout (shared across all 5 screens)

**Sidebar** (fixed, 260px wide, left, full height, white bg, right border):
- Logo block: "EduAdmin Pro" (headline-sm, primary color) + "Principal Portal" (label-sm,
  on-surface-variant) subtitle
- Nav items (icon + label), in order: Dashboard (`dashboard`), Students (`group`),
  Attendance (`calendar_today`), Fees (`payments`), Reports (`assessment`)
- Active route gets the active styling described above
- Bottom of sidebar: "New Registration" primary button, then Settings (`settings`) and
  Logout (`logout`, styled in error/red) links

**Topbar** (fixed, 64px tall, spans remaining width, white bg, bottom border):
- Left: search input ("Search students, records, or staff...") with `search` icon
  (some screens replace this with class/section `<select>` filters — see per-screen notes)
- Right: notification bell (`notifications`, with red dot badge), divider, admin avatar
  + "Admin Profile" label

Build this as a shared `<Layout>` component (`Sidebar.jsx` + `Topbar.jsx`) that wraps
each page via `react-router-dom`'s `<Outlet />`, with the active nav item computed from
the current route.

## Per-screen content (build from `reference/<screen>/code.html`)

### 1. Dashboard (`/`)
- Row of KPI stat cards (large number in `display-lg`, trend indicator in emerald)
- Weekly attendance bar chart (animated bar heights)
- Fee collection donut/ring chart showing "88% Collected", with Received ($1.2M) /
  Outstanding ($164k) legend and a "View Details" outline button
- Recent Activity feed panel: icon + bold title + gray subtext + timestamp, for each
  of: fee payment, attendance marked, new admission inquiry, emergency alert broadcast
- Academic Calendar panel: 2-column grid of upcoming-event cards, each with a colored
  left border (by event type), title, date/time, and icon

### 2. Student Management (`/students`)
- Page header: "Student Management" + "Add Student" primary button (icon `person_add`)
- Data table, columns: **Student** (avatar+name+roll no), **Guardian Contact**,
  **Fee Status** (pill chip), **Attendance** (%), **Action** (icon buttons, `more_vert`)
- Search/filter controls above the table

### 3. Attendance (`/attendance`)
- Class/Section `<select>` filters in the topbar area (Class 10/11/12, Section A/B/C)
- Summary header card: Daily Attendance % (display-lg, with trend), divider, then
  Present / Absent / Late counts
- "Export Daily Report" outline button + "Mark All Present" emerald button
- "Student Roll Call" panel: list of students, each row = roll number, circular avatar
  with initials, name + roll no, and a 3-way segmented control (Present / Absent / Late)
  implemented as radio-button pills (use React state instead of raw radio inputs —
  same visual result: selected = colored fill, matching Present=emerald,
  Absent=red, Late=tertiary/amber)
- Also present in reference: "Historical Lookback" (calendar) and "Attendance Audit"
  sections — check `code.html` for exact placement/content

### 4. Fee Management (`/fees`)
- Page header: "Fee Management" + stat callouts ($42,850 / $124,200 — check code.html
  for exact labels, likely "Collected This Month" / "Total Outstanding" or similar)
- Filter button (`filter_list`)
- Data table, columns: **Student**, **Class**, **Amount Due**, **Due Date**,
  **Status** (pill: Paid/Overdue/Pending), **Actions** (includes `send` icon for
  reminder)
- Bulk "Send Reminder" action

### 5. Reports & Analytics (`/reports`)
- "Weekly Summary" card (this is the AI-generated insight card — for now, static copy
  from the reference; wire to Gemini in a later pass)
- "Weekly Attendance Trend" chart
- "Fee Collection Trend" chart
- "Sectional Performance Matrix" — likely a table/heatmap comparing sections; check
  `code.html` for exact structure

## Componentization guidance
Pull these into reusable components since they repeat across screens:
- `Sidebar.jsx`, `Topbar.jsx`, `Layout.jsx`
- `StatCard.jsx` (big number + trend)
- `StatusChip.jsx` (pill, colored by status: paid/emerald, overdue/red, pending/gray)
- `DataTable.jsx` (or per-page table if columns differ too much to share cleanly)
- `Avatar.jsx` (circular initials avatar, color varies per reference)
- `AttendanceToggle.jsx` (Present/Absent/Late segmented control)
- `ActivityItem.jsx` (icon + title + subtext + timestamp, used in Recent Activity)

## File structure to generate
```
src/
  components/
    layout/Sidebar.jsx
    layout/Topbar.jsx
    layout/Layout.jsx
    ui/StatCard.jsx
    ui/StatusChip.jsx
    ui/Avatar.jsx
    ui/AttendanceToggle.jsx
    ui/ActivityItem.jsx
  pages/
    Dashboard.jsx
    Students.jsx
    Attendance.jsx
    Fees.jsx
    Reports.jsx
  data/
    mockStudents.js
    mockFees.js
    mockActivity.js
  App.jsx
  main.jsx
  index.css
tailwind.config.js
```

## Fidelity checklist (verify before calling it done)
- [ ] Sidebar width is exactly 260px, fixed, on every screen
- [ ] Topbar is exactly 64px tall, fixed, on every screen
- [ ] All colors come from the token list above — no default Tailwind blue/gray/green
- [ ] All icons are Material Symbols Outlined, matching the exact icon name used in
      each `code.html` (don't substitute lucide-react or another icon set)
- [ ] Inter font loaded and applied globally
- [ ] Card radius = 8px (`rounded-xl` per config), button radius = 6px
- [ ] Status colors: emerald = positive/paid, red = alert/overdue/absent, matches
      exactly what's tinted in the reference
- [ ] Copy (labels, headings, placeholder text) matches the reference HTML — don't
      paraphrase or invent new labels where the reference already has one
