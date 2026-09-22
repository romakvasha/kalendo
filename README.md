# Kalendo

An online appointment-booking system for service businesses — hair and beauty salons,
physiotherapy, dental practices, car workshops. One product, three surfaces:

| Surface | Route | For whom |
|---|---|---|
| Client app | `/app` | the client: find a company, book, pay, manage visits |
| Public company page | `/b/[slug]` | that company's own clients — no account needed |
| Admin panel | `/panel` | the owner and the team: calendar, clients, money, reports |

Every company that buys the system gets its own page, such as `aurora.kalendo.pl`
(`/b/aurora` in this demo), with its own logo, brand colour and languages.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000

```bash
npm run build
```

Requires Node.js 20.9+ (tested on 24). Next.js 16 uses Turbopack by default — no flag
needed.

---

## Demo data

The project runs on deterministic demo data — no database, no backend. That is
deliberate: the product can be shown to a customer immediately, and the data layer is
swapped in one place.

**The demo clock is pinned** to `2026-09-21, 11:05` (the `TODAY` and `NOW_ISO` constants
in `src/lib/format.ts` and `src/lib/data/seed.ts`). That keeps the calendar, the reports
and "your next visit" looking identical on every run, and matching the reference design.

Three demo companies:

| Company | Route | Industry | Colour |
|---|---|---|---|
| Studio Aurora | `/b/aurora` | hair salon | cobalt |
| Fizjo Balans | `/b/fizjobalans` | physiotherapy | green |
| Garaż 44 | `/b/garaz44` | car workshop and tyres | orange |

The seed holds 30 services, 12 specialists, 47 clients, 140 appointments, plus reviews,
gift cards, passes, stock, payments and assistant suggestions.

---

## Architecture

```
src/
  app/
    page.tsx              marketing landing page
    (auth)/               sign-up and sign-in
    onboarding/           5-step company setup wizard
    app/                  client app
    b/[slug]/             public company page + booking flow
    panel/                admin panel (15 modules)
  components/
    ui/                   design system: 33 components
    layout/               shells: sidebar, tab bar, headers
    brand/                logos, phone frame, language and theme switchers
    charts/               charts in plain SVG, no library
  lib/
    types.ts              the domain model
    data/                 seed, store (zustand), queries
    i18n/                 three languages, 1310 keys each
    format.ts             money, dates, duration — locale aware
    brand.ts              brand themes and service colours
    calendar-geometry.ts  the maths behind the day calendar
    nav.ts                navigation configuration
```

### The data layer

`src/lib/data/queries.ts` — pure functions taking `DataState` as their first argument.
`src/lib/data/store.ts` — a zustand store persisted to `localStorage`.
`src/lib/data/hooks.ts` — thin React hooks over both.

To connect a real backend you replace exactly these three files; the types, the
components and the screens stay as they are. The most important function is `slotsFor()`:
it computes real availability (opening hours, minus appointments, minus breaks, with the
service duration required to fit) rather than returning a hard-coded list.

Records the user creates at runtime live in a separate `custom` slice, and the catalogue
the app reads is always seed + custom. That keeps storage small and lets a change to the
demo data still reach browsers that already hold a user-created company.

### Languages

Polish, English and Ukrainian. The dictionaries are nested and addressed with dots:
`t("panel.calendar.today")`. The chosen locale is kept in `localStorage` and read after
mount, so the server and the first client render agree.

Instrument Serif has no Cyrillic, so Playfair Display is loaded for Ukrainian headings —
the browser falls back per glyph.

Polish and Ukrainian inflect, and `Intl` only ever returns the nominative. `format.ts`
therefore exports `weekdayPhrase()` ("w środę", not "w środa"), `monthYearGenitive()`
("od listopada 2022") and `pluralize()` (1 wizyta / 2 wizyty / 5 wizyt), the last built on
`Intl.PluralRules`. Interpolate those, never a bare `Intl` result.

---

## Design system

Tokens live in `src/app/globals.css` under `@theme` (Tailwind v4 — there is no
`tailwind.config.js`).

| Token | Value | Purpose |
|---|---|---|
| `ink` | `#1A1713` | primary text, dark surfaces |
| `paper` | `#FCFAF7` | page background |
| `card` | `#FFFFFF` | a raised surface on the page |
| `cobalt` | `#1B5BDA` | the product's own accent |
| `success` | `#167645` | paid, confirmed |
| `warn` | `#FEEFCF` | warnings, no deposit |
| `svc-*` | 6 pastels | service colours on the calendar |
| `brand` | variable | the individual company's colour |

`brand` is a CSS variable written by `<BrandProvider>`. That is why the same `bg-brand`
button is blue in Aurora, green in Fizjo Balans and orange in Garaż 44, with no duplicated
styles.

### Light and dark themes

Every colour is declared twice: on `:root` and on `.dark`. Components use tokens, so
switching theme needs no `dark:` in the markup — the whole project contains just two such
exceptions (the dialog scrim and the switch knob), each with a comment explaining why.

Two behaviours to know before editing:

- **`ink` and `paper` swap roles.** In dark mode `ink` becomes warm off-white and `paper`
  near-black. That is what makes every maximum-contrast surface (`bg-ink text-paper`: the
  assistant card, the next-visit card, primary buttons) invert by itself and keep its
  intent. Do not work around it.
- **The `sand` ramp inverts.** `sand-50` is always nearest the page background and
  `sand-800` nearest the text, so `bg-sand-100` stays a subtle chip in both themes.

Company brand colours carry dark variants in `brand.ts`. `BrandProvider` writes them as
inline styles, which would beat the `.dark` rules, so the CSS `light-dark()` function
makes the choice.

Contrast was verified by measuring in the browser rather than by eye: 0 WCAG AA failures
on the key screens in both themes. The only dimmed elements are past dates and taken
slots, which the standard exempts as inactive controls.

---

## Adding a company

Two ways, depending on what you need.

**At runtime** — go through `/onboarding`. The wizard calls `createTenant()` on the store,
which builds the tenant, a category, the services, the staff, a room and the owner's
account, then signs that account in. The company is persisted and its `/b/<slug>` page
works immediately, including after a reload. Note that it exists only in that browser
until there is a backend.

**In the seed** — for a company that should ship with the product:

1. Add a `Tenant` to `SEED_TENANTS` (`src/lib/data/seed.ts`) — slug, industry, `brand`,
   opening hours, deposit policy.
2. Add categories, services and staff carrying the same `tenantId`.
3. Where the industry needs them, describe `customFields` — the booking-form fields
   specific to that trade, such as car make and registration for a workshop.

The `/b/<slug>` page appears on its own, and a seeded company is server-rendered.

---

## What is demo and what is production-ready

**Ready:** the whole UI system, accessibility, responsiveness, the three languages, both
themes, availability computation, the overlap geometry of the calendar, CSV and ICS
export, and all state and mutations.

**Needs a backend before you can sell it:**

- a real database and tenant isolation at the database level (currently `localStorage`);
- authentication — SMS code, Google, Apple (any code is currently accepted);
- payments — BLIK, cards, Apple/Google Pay (currently simulated);
- sending SMS and e-mail (currently only toasts in the UI);
- fiscalisation, VAT invoices, JPK;
- GDPR work: a data-processing agreement, retention periods, the right to erasure.

A company created through the wizard lives in one browser, so its booking link cannot be
shared until the database exists. Seeded companies are server-rendered and open anywhere.

---

## Licence

Private project.
