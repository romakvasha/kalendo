import { addMinutes, TODAY, weekdayOf } from "@/lib/format";
import { clamp, hashRatio, initialsOf, range, sum } from "@/lib/utils";
import type {
  Account,
  AiSuggestion,
  Appointment,
  AppointmentStatus,
  BlockKind,
  BookingSource,
  CalendarBlock,
  Client,
  ClientTag,
  DailyMetric,
  LocalizedText,
  Membership,
  OpeningHours,
  PaymentRecord,
  PaymentStatus,
  Product,
  Review,
  Room,
  RodoConsent,
  Service,
  ServiceCategory,
  Staff,
  Tenant,
  Voucher,
  WaitlistEntry,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Authoring helpers                                                   */
/* ------------------------------------------------------------------ */

const L = (pl: string, en: string, uk: string): LocalizedText => ({ pl, en, uk });

/** The demo clock also has an hour: the panel renders 21 Sept 2026, 11:05. */
export const NOW_TIME = "11:05";
export const NOW_MINUTES = 11 * 60 + 5;
export const NOW_ISO = `${TODAY}T${NOW_TIME}:00`;

/** Mon–Fri identical, then Saturday and Sunday (null = closed). */
function week(
  weekday: [string, string],
  saturday: [string, string] | null,
  sunday: [string, string] | null,
): OpeningHours[] {
  return [
    ...[1, 2, 3, 4, 5].map((day) => ({
      weekday: day,
      open: weekday[0],
      close: weekday[1],
    })),
    { weekday: 6, open: saturday?.[0] ?? null, close: saturday?.[1] ?? null },
    { weekday: 7, open: sunday?.[0] ?? null, close: sunday?.[1] ?? null },
  ];
}

function consents(marketing: boolean, photos = false): RodoConsent[] {
  return [
    {
      id: "rodo",
      label: L(
        "Przetwarzanie danych osobowych (RODO)",
        "Processing of personal data (GDPR)",
        "Обробка персональних даних (GDPR)",
      ),
      granted: true,
      grantedAt: "2025-11-04",
    },
    {
      id: "marketing",
      label: L(
        "Powiadomienia SMS i e-mail o promocjach",
        "SMS and e-mail marketing messages",
        "SMS та e-mail про акції",
      ),
      granted: marketing,
      grantedAt: marketing ? "2025-11-04" : undefined,
    },
    {
      id: "photos",
      label: L(
        "Publikacja zdjęć efektów w social media",
        "Publishing before/after photos on social media",
        "Публікація фото результатів у соцмережах",
      ),
      granted: photos,
      grantedAt: photos ? "2026-02-18" : undefined,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Tenants                                                             */
/* ------------------------------------------------------------------ */

export const SEED_TENANTS: Tenant[] = [
  {
    id: "t_aurora",
    slug: "aurora",
    name: "Studio Aurora",
    industry: "hair",
    brand: "cobalt",
    plan: "pro",
    tagline: L(
      "Salon fryzjerski w sercu Wrocławia",
      "Hair studio in the heart of Wrocław",
      "Перукарня в самому серці Вроцлава",
    ),
    about: L(
      "Kameralne studio z czterema stanowiskami. Specjalizujemy się w koloryzacji i strzyżeniach, które układają się same. Pracujemy na kosmetykach bez siarczanów, a każdą wizytę zaczynamy od krótkiej konsultacji.",
      "A four-chair studio focused on colour and cuts that fall into place on their own. We work with sulphate-free products and start every visit with a short consultation.",
      "Камерна студія на чотири робочі місця. Спеціалізуємося на фарбуванні та стрижках, які лягають самі. Працюємо на косметиці без сульфатів і починаємо кожен візит із короткої консультації.",
    ),
    city: "Wrocław",
    address: "ul. Kwiatowa 12",
    phone: "+48 601 234 567",
    email: "kontakt@studioaurora.pl",
    rating: 4.9,
    reviewCount: 312,
    distanceKm: 0.8,
    openingHours: week(["08:00", "20:00"], ["09:00", "16:00"], null),
    features: [
      "online-payment",
      "loyalty",
      "vouchers",
      "products",
      "waitlist",
      "invoices",
    ],
    locations: [
      {
        id: "loc_aur_1",
        name: "Studio Aurora",
        address: "ul. Kwiatowa 12",
        city: "Wrocław",
      },
    ],
    customFields: [
      {
        id: "hair_length",
        label: L("Długość włosów", "Hair length", "Довжина волосся"),
        type: "select",
        required: false,
        half: true,
        options: ["Krótkie", "Do ramion", "Długie", "Bardzo długie"],
      },
      {
        id: "color_note",
        label: L(
          "Historia koloryzacji",
          "Colour history",
          "Історія фарбування",
        ),
        type: "text",
        required: false,
        placeholder: "Ostatnia koloryzacja, farby domowe, rozjaśnianie…",
      },
    ],
    deposit: { enabled: true, mode: "percent", value: 20 },
    cancellationHours: 24,
    photoCount: 8,
    ownerName: "Anna",
    loyalty: {
      pointsPerVisit: 20,
      rewardAt: 300,
      rewardLabel: L(
        "darmowa maska regeneracyjna",
        "a free repair mask",
        "безкоштовна відновлювальна маска",
      ),
    },
  },
  {
    id: "t_fizjo",
    slug: "fizjobalans",
    name: "Fizjo Balans",
    industry: "physio",
    brand: "green",
    plan: "pro",
    tagline: L(
      "Fizjoterapia, masaż i osteopatia",
      "Physiotherapy, massage and osteopathy",
      "Фізіотерапія, масаж та остеопатія",
    ),
    about: L(
      "Trzy gabinety i sala ćwiczeń. Prowadzimy terapię manualną, rehabilitację pourazową oraz zajęcia grupowe. Na pierwszą wizytę zarezerwuj 50 minut — zaczynamy od pełnego badania funkcjonalnego.",
      "Three treatment rooms and a training studio. We run manual therapy, post-injury rehab and group classes. Book 50 minutes for your first visit — we start with a full functional assessment.",
      "Три кабінети та зала для вправ. Проводимо мануальну терапію, реабілітацію після травм і групові заняття. На перший візит заплануйте 50 хвилин — починаємо з повного функціонального обстеження.",
    ),
    city: "Wrocław",
    address: "ul. Ogrodowa 5",
    phone: "+48 606 880 114",
    email: "recepcja@fizjobalans.pl",
    rating: 4.9,
    reviewCount: 212,
    distanceKm: 1.6,
    openingHours: week(["08:00", "20:00"], ["09:00", "14:00"], null),
    features: [
      "video",
      "invoices",
      "vouchers",
      "group-classes",
      "waitlist",
      "online-payment",
    ],
    locations: [
      {
        id: "loc_fiz_1",
        name: "Fizjo Balans",
        address: "ul. Ogrodowa 5",
        city: "Wrocław",
      },
    ],
    customFields: [
      {
        id: "pain_area",
        label: L("Obszar dolegliwości", "Area of pain", "Ділянка болю"),
        type: "select",
        required: true,
        half: true,
        options: [
          "Kręgosłup szyjny",
          "Kręgosłup piersiowy",
          "Kręgosłup lędźwiowy",
          "Bark",
          "Kolano",
          "Biodro",
          "Inne",
        ],
      },
      {
        id: "pain_scale",
        label: L("Ból w skali 0–10", "Pain on a 0–10 scale", "Біль за шкалою 0–10"),
        type: "number",
        required: false,
        half: true,
        placeholder: "5",
      },
      {
        id: "referral",
        label: L(
          "Skierowanie lub diagnoza",
          "Referral or diagnosis",
          "Направлення або діагноз",
        ),
        type: "text",
        required: false,
        placeholder: "Nr skierowania, opis badania obrazowego…",
      },
    ],
    deposit: { enabled: true, mode: "fixed", value: 50 },
    cancellationHours: 24,
    photoCount: 6,
    ownerName: "Tomasz",
  },
  {
    id: "t_garaz",
    slug: "garaz44",
    name: "Garaż 44",
    industry: "auto",
    brand: "orange",
    plan: "start",
    tagline: L(
      "Serwis i wulkanizacja bez kolejki",
      "Car service and tyres, no queue",
      "Автосервіс і шиномонтаж без черги",
    ),
    about: L(
      "Dwa stanowiska, konkretna wycena przed pracą i SMS, kiedy auto jest gotowe. Robimy wymianę opon, przeglądy, klimatyzację i diagnostykę komputerową. Sezonowe przechowanie opon w ogrzewanym magazynie.",
      "Two bays, a firm quote before we start and an SMS when the car is ready. Tyres, servicing, air-conditioning and computer diagnostics. Seasonal tyre storage in a heated warehouse.",
      "Два пости, точна оцінка перед роботою і SMS, коли авто готове. Робимо шиномонтаж, ТО, кондиціонери та комп'ютерну діагностику. Сезонне зберігання шин на теплому складі.",
    ),
    city: "Wrocław",
    address: "ul. Przemysłowa 3",
    phone: "+48 512 770 044",
    email: "serwis@garaz44.pl",
    rating: 4.8,
    reviewCount: 186,
    distanceKm: 2.4,
    openingHours: week(["08:00", "18:00"], ["09:00", "14:00"], null),
    features: ["invoices", "products", "waitlist"],
    locations: [
      {
        id: "loc_gar_1",
        name: "Garaż 44",
        address: "ul. Przemysłowa 3",
        city: "Wrocław",
      },
    ],
    customFields: [
      {
        id: "car",
        label: L("Marka i model", "Car make and model", "Марка і модель"),
        type: "text",
        required: true,
        half: true,
        placeholder: "Škoda Octavia III",
      },
      {
        id: "plate",
        label: L(
          "Numer rejestracyjny",
          "Registration number",
          "Номерний знак",
        ),
        type: "text",
        required: true,
        half: true,
        placeholder: "DW 1234A",
      },
      {
        id: "year",
        label: L("Rocznik", "Year", "Рік випуску"),
        type: "text",
        required: false,
        half: true,
        placeholder: "2018",
      },
      {
        id: "tyres",
        label: L("Rozmiar opon", "Tyre size", "Розмір шин"),
        type: "text",
        required: false,
        placeholder: "205/55 R16",
      },
    ],
    deposit: { enabled: false, mode: "fixed", value: 0 },
    cancellationHours: 12,
    photoCount: 5,
    ownerName: "Marek",
  },
];

/* ------------------------------------------------------------------ */
/* Rooms                                                               */
/* ------------------------------------------------------------------ */

export const SEED_ROOMS: Room[] = [
  { id: "rm_aur_1", tenantId: "t_aurora", locationId: "loc_aur_1", name: L("Stanowisko 1", "Chair 1", "Місце 1") },
  { id: "rm_aur_2", tenantId: "t_aurora", locationId: "loc_aur_1", name: L("Stanowisko 2", "Chair 2", "Місце 2") },
  { id: "rm_aur_3", tenantId: "t_aurora", locationId: "loc_aur_1", name: L("Stanowisko 3", "Chair 3", "Місце 3") },
  { id: "rm_aur_4", tenantId: "t_aurora", locationId: "loc_aur_1", name: L("Myjnia", "Wash station", "Мийка") },
  { id: "rm_fiz_1", tenantId: "t_fizjo", locationId: "loc_fiz_1", name: L("Gabinet 1", "Room 1", "Кабінет 1") },
  { id: "rm_fiz_2", tenantId: "t_fizjo", locationId: "loc_fiz_1", name: L("Gabinet 2", "Room 2", "Кабінет 2") },
  { id: "rm_fiz_3", tenantId: "t_fizjo", locationId: "loc_fiz_1", name: L("Sala ćwiczeń", "Training studio", "Зала для вправ") },
  { id: "rm_gar_1", tenantId: "t_garaz", locationId: "loc_gar_1", name: L("Stanowisko 1", "Bay 1", "Пост 1") },
  { id: "rm_gar_2", tenantId: "t_garaz", locationId: "loc_gar_1", name: L("Stanowisko 2", "Bay 2", "Пост 2") },
];

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

function person(
  input: Omit<Staff, "initials"> & { initials?: string },
): Staff {
  return { ...input, initials: input.initials ?? initialsOf(input.name) };
}

export const SEED_STAFF: Staff[] = [
  person({
    id: "stf_aur_ola",
    tenantId: "t_aurora",
    name: "Ola Wiśniewska",
    role: L("Stylistka", "Stylist", "Стилістка"),
    rating: 4.9,
    avatarColor: "#1b5bda",
    utilization: 86,
    bookedHoursToday: 6.5,
    availableHoursToday: 8,
    locationId: "loc_aur_1",
  }),
  person({
    id: "stf_aur_kasia",
    tenantId: "t_aurora",
    name: "Kasia Dąbrowska",
    role: L("Kolorystka", "Colourist", "Колористка"),
    rating: 5,
    avatarColor: "#c23e6b",
    utilization: 94,
    bookedHoursToday: 7.5,
    availableHoursToday: 8,
    locationId: "loc_aur_1",
  }),
  person({
    id: "stf_aur_michal",
    tenantId: "t_aurora",
    name: "Michał Zieliński",
    role: L("Barber", "Barber", "Барбер"),
    rating: 4.8,
    avatarColor: "#e8802a",
    utilization: 61,
    bookedHoursToday: 4,
    availableHoursToday: 8,
    locationId: "loc_aur_1",
  }),
  person({
    id: "stf_aur_anna",
    tenantId: "t_aurora",
    name: "Anna Kowalczyk",
    role: L("Właścicielka", "Owner", "Власниця"),
    rating: 5,
    avatarColor: "#6d4bd6",
    utilization: 52,
    bookedHoursToday: 3.5,
    availableHoursToday: 7,
    locationId: "loc_aur_1",
    isOwner: true,
  }),
  person({
    id: "stf_fiz_tomasz",
    tenantId: "t_fizjo",
    name: "Tomasz Lis",
    role: L("Fizjoterapeuta", "Physiotherapist", "Фізіотерапевт"),
    rating: 5,
    avatarColor: "#167645",
    utilization: 88,
    bookedHoursToday: 5,
    availableHoursToday: 8,
    locationId: "loc_fiz_1",
    isOwner: true,
  }),
  person({
    id: "stf_fiz_ewa",
    tenantId: "t_fizjo",
    name: "Ewa Mazur",
    role: L("Masażystka", "Massage therapist", "Масажистка"),
    rating: 4.9,
    avatarColor: "#0f766e",
    utilization: 74,
    bookedHoursToday: 3.5,
    availableHoursToday: 6,
    locationId: "loc_fiz_1",
  }),
  person({
    id: "stf_fiz_piotr",
    tenantId: "t_fizjo",
    name: "Piotr Wróbel",
    role: L("Osteopata", "Osteopath", "Остеопат"),
    rating: 4.8,
    avatarColor: "#b45309",
    utilization: 42,
    bookedHoursToday: 3,
    availableHoursToday: 7,
    locationId: "loc_fiz_1",
  }),
  person({
    id: "stf_fiz_karolina",
    tenantId: "t_fizjo",
    name: "Karolina Nowak",
    role: L("Fizjoterapeutka", "Physiotherapist", "Фізіотерапевтка"),
    rating: 4.9,
    avatarColor: "#7c3aed",
    utilization: 79,
    bookedHoursToday: 4.5,
    availableHoursToday: 8,
    locationId: "loc_fiz_1",
  }),
  person({
    id: "stf_gar_marek",
    tenantId: "t_garaz",
    name: "Marek Kowal",
    role: L("Mechanik, właściciel", "Mechanic, owner", "Механік, власник"),
    rating: 4.9,
    avatarColor: "#9a4d0d",
    utilization: 81,
    bookedHoursToday: 6,
    availableHoursToday: 9,
    locationId: "loc_gar_1",
    isOwner: true,
  }),
  person({
    id: "stf_gar_darek",
    tenantId: "t_garaz",
    name: "Dariusz Sikora",
    role: L("Mechanik", "Mechanic", "Механік"),
    rating: 4.8,
    avatarColor: "#0369a1",
    utilization: 72,
    bookedHoursToday: 4.5,
    availableHoursToday: 9,
    locationId: "loc_gar_1",
  }),
  person({
    id: "stf_gar_bartek",
    tenantId: "t_garaz",
    name: "Bartosz Nowicki",
    role: L("Wulkanizator", "Tyre technician", "Шиномонтажник"),
    rating: 4.7,
    avatarColor: "#4d7c0f",
    utilization: 38,
    bookedHoursToday: 2,
    availableHoursToday: 5,
    locationId: "loc_gar_1",
  }),
  person({
    id: "stf_gar_iwona",
    tenantId: "t_garaz",
    name: "Iwona Lewandowska",
    role: L("Doradca serwisowy", "Service advisor", "Сервісний консультант"),
    rating: 4.9,
    avatarColor: "#be123c",
    utilization: 0,
    bookedHoursToday: 0,
    availableHoursToday: 9,
    locationId: "loc_gar_1",
  }),
];

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const SEED_CATEGORIES: ServiceCategory[] = [
  { id: "cat_aur_cut", tenantId: "t_aurora", name: L("Strzyżenie", "Haircuts", "Стрижка") },
  { id: "cat_aur_color", tenantId: "t_aurora", name: L("Koloryzacja", "Colour", "Фарбування") },
  { id: "cat_aur_style", tenantId: "t_aurora", name: L("Stylizacja", "Styling", "Стилізація") },
  { id: "cat_aur_care", tenantId: "t_aurora", name: L("Pielęgnacja", "Treatments", "Догляд") },
  { id: "cat_fiz_physio", tenantId: "t_fizjo", name: L("Fizjoterapia", "Physiotherapy", "Фізіотерапія") },
  { id: "cat_fiz_massage", tenantId: "t_fizjo", name: L("Masaż", "Massage", "Масаж") },
  { id: "cat_fiz_osteo", tenantId: "t_fizjo", name: L("Osteopatia", "Osteopathy", "Остеопатія") },
  { id: "cat_fiz_online", tenantId: "t_fizjo", name: L("Online", "Online", "Онлайн") },
  { id: "cat_fiz_group", tenantId: "t_fizjo", name: L("Zajęcia grupowe", "Group classes", "Групові заняття") },
  { id: "cat_fiz_packs", tenantId: "t_fizjo", name: L("Pakiety", "Packages", "Пакети") },
  { id: "cat_gar_tyres", tenantId: "t_garaz", name: L("Opony", "Tyres", "Шини") },
  { id: "cat_gar_mech", tenantId: "t_garaz", name: L("Mechanika", "Mechanics", "Механіка") },
  { id: "cat_gar_ac", tenantId: "t_garaz", name: L("Klimatyzacja", "Air conditioning", "Кондиціонер") },
  { id: "cat_gar_diag", tenantId: "t_garaz", name: L("Diagnostyka", "Diagnostics", "Діагностика") },
];

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

export const SEED_SERVICES: Service[] = [
  {
    id: "svc_aur_cut_w",
    tenantId: "t_aurora",
    categoryId: "cat_aur_cut",
    name: L(
      "Strzyżenie damskie + modelowanie",
      "Women's cut + blow-dry",
      "Жіноча стрижка + укладка",
    ),
    description: L(
      "Konsultacja, mycie, strzyżenie i modelowanie.",
      "Consultation, wash, cut and blow-dry.",
      "Консультація, миття, стрижка та укладка.",
    ),
    durationMin: 60,
    price: 120,
    color: "sky",
    staffIds: ["stf_aur_ola", "stf_aur_michal", "stf_aur_anna"],
    addonIds: ["svc_aur_mask", "svc_aur_olaplex"],
    popular: true,
  },
  {
    id: "svc_aur_cut_m",
    tenantId: "t_aurora",
    categoryId: "cat_aur_cut",
    name: L("Strzyżenie męskie", "Men's cut", "Чоловіча стрижка"),
    description: L(
      "Maszynka i nożyce, wykończenie brzytwą.",
      "Clipper and scissor work, razor finish.",
      "Машинка та ножиці, фінал бритвою.",
    ),
    durationMin: 30,
    price: 60,
    color: "sky",
    staffIds: ["stf_aur_michal", "stf_aur_ola"],
    addonIds: ["svc_aur_mask"],
  },
  {
    id: "svc_aur_cut_kid",
    tenantId: "t_aurora",
    categoryId: "cat_aur_cut",
    name: L("Strzyżenie dziecięce", "Kids' cut", "Дитяча стрижка"),
    description: L("Do 12 lat.", "Up to 12 years old.", "До 12 років."),
    durationMin: 30,
    price: 50,
    color: "sky",
    staffIds: ["stf_aur_michal", "stf_aur_ola"],
  },
  {
    id: "svc_aur_color",
    tenantId: "t_aurora",
    categoryId: "cat_aur_color",
    name: L("Koloryzacja globalna", "Full-head colour", "Повне фарбування"),
    description: L(
      "Kolor na całej długości, mycie i modelowanie w cenie.",
      "Colour over the full length, wash and blow-dry included.",
      "Колір по всій довжині, миття та укладка в ціні.",
    ),
    durationMin: 150,
    price: 250,
    priceFrom: true,
    color: "violet",
    staffIds: ["stf_aur_kasia", "stf_aur_anna"],
    addonIds: ["svc_aur_mask", "svc_aur_olaplex"],
    popular: true,
  },
  {
    id: "svc_aur_balayage",
    tenantId: "t_aurora",
    categoryId: "cat_aur_color",
    name: L("Balayage / sombré", "Balayage / sombré", "Балаяж / сомбре"),
    description: L(
      "Rozjaśnianie z cieniowaniem odrostu.",
      "Lightening with a soft grown-out root.",
      "Освітлення з м'яким переходом коренів.",
    ),
    durationMin: 180,
    price: 420,
    priceFrom: true,
    color: "violet",
    staffIds: ["stf_aur_kasia"],
    addonIds: ["svc_aur_olaplex"],
  },
  {
    id: "svc_aur_roots",
    tenantId: "t_aurora",
    categoryId: "cat_aur_color",
    name: L("Tonowanie odrostów", "Root touch-up", "Тонування коренів"),
    durationMin: 90,
    price: 180,
    color: "violet",
    staffIds: ["stf_aur_kasia", "stf_aur_anna"],
  },
  {
    id: "svc_aur_style",
    tenantId: "t_aurora",
    categoryId: "cat_aur_style",
    name: L("Upięcie okolicznościowe", "Event updo", "Святкова зачіска"),
    description: L(
      "Ślub, wesele, sesja — z próbą fryzury.",
      "Weddings and photo shoots, trial included.",
      "Весілля чи зйомка — з пробною зачіскою.",
    ),
    durationMin: 60,
    price: 150,
    color: "rose",
    staffIds: ["stf_aur_ola", "stf_aur_anna"],
  },
  {
    id: "svc_aur_blowdry",
    tenantId: "t_aurora",
    categoryId: "cat_aur_style",
    name: L("Modelowanie brushingiem", "Brush blow-dry", "Укладка брашингом"),
    durationMin: 40,
    price: 80,
    color: "rose",
    staffIds: ["stf_aur_ola", "stf_aur_michal", "stf_aur_anna"],
  },
  {
    id: "svc_aur_mask",
    tenantId: "t_aurora",
    categoryId: "cat_aur_care",
    name: L("Maska regeneracyjna", "Repair mask", "Відновлювальна маска"),
    description: L(
      "Dodatek do każdej usługi, 15 minut.",
      "A 15-minute add-on to any service.",
      "Доповнення до будь-якої послуги, 15 хвилин.",
    ),
    durationMin: 15,
    price: 40,
    color: "mint",
    staffIds: [],
  },
  {
    id: "svc_aur_olaplex",
    tenantId: "t_aurora",
    categoryId: "cat_aur_care",
    name: L("Zabieg Olaplex", "Olaplex treatment", "Процедура Olaplex"),
    durationMin: 30,
    price: 90,
    color: "mint",
    staffIds: [],
  },
  {
    id: "svc_aur_keratin",
    tenantId: "t_aurora",
    categoryId: "cat_aur_care",
    name: L(
      "Keratynowe prostowanie",
      "Keratin straightening",
      "Кератинове випрямлення",
    ),
    durationMin: 120,
    price: 380,
    color: "mint",
    staffIds: ["stf_aur_anna", "stf_aur_kasia"],
  },

  {
    id: "svc_fiz_consult",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_physio",
    name: L(
      "Konsultacja fizjoterapeutyczna",
      "Physiotherapy consultation",
      "Консультація фізіотерапевта",
    ),
    description: L(
      "Badanie funkcjonalne, plan terapii i ćwiczenia domowe.",
      "Functional assessment, therapy plan and home exercises.",
      "Функціональне обстеження, план терапії та вправи вдома.",
    ),
    durationMin: 50,
    price: 180,
    color: "mint",
    staffIds: ["stf_fiz_tomasz", "stf_fiz_karolina"],
    popular: true,
  },
  {
    id: "svc_fiz_manual",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_physio",
    name: L("Terapia manualna", "Manual therapy", "Мануальна терапія"),
    durationMin: 50,
    price: 200,
    color: "mint",
    staffIds: ["stf_fiz_tomasz", "stf_fiz_karolina"],
    addonIds: ["svc_fiz_needle"],
    popular: true,
  },
  {
    id: "svc_fiz_rehab",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_physio",
    name: L(
      "Rehabilitacja pourazowa",
      "Post-injury rehabilitation",
      "Реабілітація після травм",
    ),
    durationMin: 50,
    price: 190,
    color: "mint",
    staffIds: ["stf_fiz_karolina", "stf_fiz_tomasz"],
  },
  {
    id: "svc_fiz_needle",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_physio",
    name: L(
      "Terapia igłowa (dry needling)",
      "Dry needling",
      "Голкова терапія (dry needling)",
    ),
    durationMin: 30,
    price: 120,
    color: "mint",
    staffIds: ["stf_fiz_tomasz"],
  },
  {
    id: "svc_fiz_massage",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_massage",
    name: L("Masaż leczniczy", "Therapeutic massage", "Лікувальний масаж"),
    durationMin: 60,
    price: 170,
    color: "peach",
    staffIds: ["stf_fiz_ewa"],
    popular: true,
  },
  {
    id: "svc_fiz_sport",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_massage",
    name: L("Masaż sportowy", "Sports massage", "Спортивний масаж"),
    durationMin: 45,
    price: 150,
    color: "peach",
    staffIds: ["stf_fiz_ewa"],
  },
  {
    id: "svc_fiz_osteo",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_osteo",
    name: L("Wizyta osteopatyczna", "Osteopathy session", "Остеопатичний прийом"),
    durationMin: 60,
    price: 220,
    color: "sand",
    staffIds: ["stf_fiz_piotr"],
  },
  {
    id: "svc_fiz_online",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_online",
    name: L(
      "Konsultacja online (wideo)",
      "Online consultation (video)",
      "Онлайн-консультація (відео)",
    ),
    description: L(
      "Link do rozmowy przychodzi SMS-em 10 minut przed wizytą.",
      "A video link arrives by SMS 10 minutes before the visit.",
      "Посилання на відеозустріч приходить SMS за 10 хвилин.",
    ),
    durationMin: 30,
    price: 120,
    color: "sky",
    staffIds: ["stf_fiz_tomasz", "stf_fiz_karolina"],
    online: true,
  },
  {
    id: "svc_fiz_pilates",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_group",
    name: L(
      "Pilates kręgosłupa — zajęcia grupowe",
      "Spine pilates — group class",
      "Пілатес для хребта — групове заняття",
    ),
    durationMin: 55,
    price: 60,
    color: "violet",
    staffIds: ["stf_fiz_karolina"],
    group: { capacity: 8, taken: 5 },
  },
  {
    id: "svc_fiz_pack5",
    tenantId: "t_fizjo",
    categoryId: "cat_fiz_packs",
    name: L(
      "Pakiet 5 wizyt — terapia manualna",
      "5-visit package — manual therapy",
      "Пакет 5 візитів — мануальна терапія",
    ),
    description: L(
      "Pięć wizyt po 50 minut, ważne 6 miesięcy.",
      "Five 50-minute visits, valid for 6 months.",
      "П'ять візитів по 50 хвилин, дійсні 6 місяців.",
    ),
    durationMin: 50,
    price: 900,
    color: "rose",
    staffIds: ["stf_fiz_tomasz", "stf_fiz_karolina"],
  },

  {
    id: "svc_gar_tyres",
    tenantId: "t_garaz",
    categoryId: "cat_gar_tyres",
    name: L("Wymiana opon (4 szt.)", "Tyre change (4 wheels)", "Заміна шин (4 шт.)"),
    durationMin: 45,
    price: 120,
    color: "sand",
    staffIds: ["stf_gar_darek", "stf_gar_bartek"],
    popular: true,
  },
  {
    id: "svc_gar_tyres_bal",
    tenantId: "t_garaz",
    categoryId: "cat_gar_tyres",
    name: L(
      "Wymiana opon z wyważeniem",
      "Tyre change with balancing",
      "Заміна шин з балансуванням",
    ),
    durationMin: 60,
    price: 160,
    color: "sand",
    staffIds: ["stf_gar_darek", "stf_gar_bartek"],
  },
  {
    id: "svc_gar_storage",
    tenantId: "t_garaz",
    categoryId: "cat_gar_tyres",
    name: L(
      "Przechowanie kompletu opon",
      "Seasonal tyre storage",
      "Зберігання комплекту шин",
    ),
    description: L(
      "Cena za cały sezon, magazyn ogrzewany.",
      "Price for the whole season, heated warehouse.",
      "Ціна за весь сезон, опалюваний склад.",
    ),
    durationMin: 15,
    price: 150,
    color: "sand",
    staffIds: ["stf_gar_bartek"],
  },
  {
    id: "svc_gar_puncture",
    tenantId: "t_garaz",
    categoryId: "cat_gar_tyres",
    name: L(
      "Naprawa przebitej opony",
      "Puncture repair",
      "Ремонт проколу шини",
    ),
    durationMin: 30,
    price: 50,
    priceFrom: true,
    color: "sand",
    staffIds: ["stf_gar_bartek", "stf_gar_darek"],
  },
  {
    id: "svc_gar_oil",
    tenantId: "t_garaz",
    categoryId: "cat_gar_mech",
    name: L(
      "Wymiana oleju z filtrem",
      "Oil and filter change",
      "Заміна оливи з фільтром",
    ),
    durationMin: 60,
    price: 180,
    color: "sky",
    staffIds: ["stf_gar_marek", "stf_gar_darek"],
    popular: true,
  },
  {
    id: "svc_gar_service",
    tenantId: "t_garaz",
    categoryId: "cat_gar_mech",
    name: L("Przegląd okresowy", "Scheduled service", "Періодичне ТО"),
    durationMin: 90,
    price: 350,
    color: "sky",
    staffIds: ["stf_gar_marek", "stf_gar_darek"],
  },
  {
    id: "svc_gar_susp",
    tenantId: "t_garaz",
    categoryId: "cat_gar_mech",
    name: L(
      "Diagnostyka i naprawa zawieszenia",
      "Suspension diagnosis and repair",
      "Діагностика й ремонт підвіски",
    ),
    durationMin: 120,
    price: 400,
    priceFrom: true,
    color: "sky",
    staffIds: ["stf_gar_marek"],
  },
  {
    id: "svc_gar_ac",
    tenantId: "t_garaz",
    categoryId: "cat_gar_ac",
    name: L(
      "Nabijanie klimatyzacji",
      "Air-con regas",
      "Заправка кондиціонера",
    ),
    durationMin: 60,
    price: 250,
    color: "mint",
    staffIds: ["stf_gar_marek", "stf_gar_darek"],
  },
  {
    id: "svc_gar_diag",
    tenantId: "t_garaz",
    categoryId: "cat_gar_diag",
    name: L(
      "Diagnostyka komputerowa",
      "Computer diagnostics",
      "Комп'ютерна діагностика",
    ),
    durationMin: 45,
    price: 150,
    color: "peach",
    staffIds: ["stf_gar_marek", "stf_gar_darek"],
  },
];

const SERVICE_INDEX = new Map(SEED_SERVICES.map((s) => [s.id, s] as const));

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

interface ClientSpec {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  since: string;
  tags: ClientTag[];
  preferredStaffId?: string;
  visits: number;
  spent: number;
  noShows?: number;
  birthday?: string;
  notes?: LocalizedText;
  alert?: LocalizedText;
  marketing?: boolean;
  photos?: boolean;
  photoCount?: number;
  points?: number;
}

function mkClient(spec: ClientSpec): Client {
  return {
    id: spec.id,
    tenantId: spec.tenantId,
    name: spec.name,
    initials: initialsOf(spec.name),
    phone: spec.phone,
    email: spec.email,
    since: spec.since,
    tags: spec.tags,
    preferredStaffId: spec.preferredStaffId,
    visitCount: spec.visits,
    totalSpent: spec.spent,
    noShows: spec.noShows ?? 0,
    birthday: spec.birthday,
    notes: spec.notes,
    alert: spec.alert,
    consents: consents(spec.marketing ?? true, spec.photos ?? false),
    photoCount: spec.photoCount ?? 0,
    loyaltyPoints: spec.points,
  };
}

/** The persona the demo signs in as — one person, three tenants. */
export const DEMO_CLIENT_PHONE = "+48 512 340 118";

export const SEED_CLIENTS: Client[] = [
  mkClient({
    id: "cl_aur_julia",
    tenantId: "t_aurora",
    name: "Julia Wiśniewska",
    phone: DEMO_CLIENT_PHONE,
    email: "julia.wisniewska@example.com",
    since: "2024-03-11",
    tags: ["regular", "vip"],
    preferredStaffId: "stf_aur_ola",
    visits: 18,
    spent: 3240,
    birthday: "1994-06-08",
    notes: L(
      "Kolor 7.1 + toner perłowy. Nie lubi bardzo krótkiej grzywki.",
      "Colour 7.1 with a pearl toner. Dislikes a very short fringe.",
      "Колір 7.1 + перлинний тонер. Не любить дуже коротку чубчик.",
    ),
    photos: true,
    photoCount: 6,
    points: 240,
  }),
  mkClient({
    id: "cl_aur_magda",
    tenantId: "t_aurora",
    name: "Magdalena Nowak",
    phone: "+48 605 112 903",
    email: "m.nowak@example.com",
    since: "2023-09-02",
    tags: ["regular"],
    preferredStaffId: "stf_aur_kasia",
    visits: 24,
    spent: 5180,
    birthday: "1988-01-22",
    notes: L(
      "Alergia na amoniak — tylko farby bezamoniakalne.",
      "Ammonia allergy — ammonia-free colour only.",
      "Алергія на аміак — тільки безаміачні фарби.",
    ),
    alert: L(
      "Alergia na amoniak",
      "Ammonia allergy",
      "Алергія на аміак",
    ),
    photoCount: 4,
    points: 180,
  }),
  mkClient({
    id: "cl_aur_ewa",
    tenantId: "t_aurora",
    name: "Ewa Krawczyk",
    phone: "+48 604 771 220",
    since: "2024-06-18",
    tags: ["regular"],
    preferredStaffId: "stf_aur_ola",
    visits: 11,
    spent: 1480,
    photoCount: 2,
    points: 120,
  }),
  mkClient({
    id: "cl_aur_piotr",
    tenantId: "t_aurora",
    name: "Piotr Zalewski",
    phone: "+48 608 220 145",
    since: "2023-04-05",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 31,
    spent: 1920,
    marketing: false,
    points: 80,
  }),
  mkClient({
    id: "cl_aur_tomek",
    tenantId: "t_aurora",
    name: "Tomasz Bąk",
    phone: "+48 501 663 018",
    since: "2026-09-21",
    tags: ["new"],
    visits: 1,
    spent: 60,
  }),
  mkClient({
    id: "cl_aur_ala",
    tenantId: "t_aurora",
    name: "Alicja Górska",
    phone: "+48 692 004 771",
    email: "alicja.gorska@example.com",
    since: "2022-11-14",
    tags: ["vip", "regular"],
    preferredStaffId: "stf_aur_kasia",
    visits: 42,
    spent: 11480,
    birthday: "1991-03-30",
    notes: L(
      "Balayage co 10 tygodni, zawsze Olaplex w pakiecie.",
      "Balayage every 10 weeks, always with Olaplex.",
      "Балаяж кожні 10 тижнів, завжди з Olaplex.",
    ),
    photos: true,
    photoCount: 9,
    points: 260,
  }),
  mkClient({
    id: "cl_aur_kinga",
    tenantId: "t_aurora",
    name: "Kinga Wolska",
    phone: "+48 600 318 042",
    since: "2025-02-09",
    tags: ["regular"],
    preferredStaffId: "stf_aur_ola",
    visits: 9,
    spent: 980,
    photoCount: 1,
    points: 100,
  }),
  mkClient({
    id: "cl_aur_marta",
    tenantId: "t_aurora",
    name: "Marta Szymańska",
    phone: "+48 663 900 214",
    email: "marta.sz@example.com",
    since: "2024-01-20",
    tags: ["regular", "birthday"],
    preferredStaffId: "stf_aur_ola",
    visits: 16,
    spent: 2340,
    birthday: "1996-09-22",
    photoCount: 3,
    points: 160,
  }),
  mkClient({
    id: "cl_aur_natalia",
    tenantId: "t_aurora",
    name: "Natalia Kubiak",
    phone: "+48 511 084 663",
    since: "2026-08-30",
    tags: ["new"],
    preferredStaffId: "stf_aur_kasia",
    visits: 2,
    spent: 360,
    points: 40,
  }),
  mkClient({
    id: "cl_aur_olga",
    tenantId: "t_aurora",
    name: "Olga Pawlak",
    phone: "+48 697 441 205",
    since: "2023-07-12",
    tags: ["regular"],
    preferredStaffId: "stf_aur_anna",
    visits: 20,
    spent: 4880,
    photoCount: 5,
    points: 200,
  }),
  mkClient({
    id: "cl_aur_bartek",
    tenantId: "t_aurora",
    name: "Bartosz Dudek",
    phone: "+48 570 221 884",
    since: "2025-05-06",
    tags: ["no-show-risk"],
    preferredStaffId: "stf_aur_michal",
    visits: 6,
    spent: 300,
    noShows: 3,
    alert: L(
      "3 nieobecności w ostatnim roku — poproś o zadatek.",
      "3 no-shows in the last year — ask for a deposit.",
      "3 неявки за останній рік — попроси завдаток.",
    ),
    marketing: false,
  }),
  mkClient({
    id: "cl_aur_lena",
    tenantId: "t_aurora",
    name: "Lena Adamczyk",
    phone: "+48 512 660 907",
    since: "2024-10-01",
    tags: ["regular"],
    preferredStaffId: "stf_aur_ola",
    visits: 13,
    spent: 2010,
    photoCount: 2,
    points: 140,
  }),
  mkClient({
    id: "cl_aur_iga",
    tenantId: "t_aurora",
    name: "Iga Mazurek",
    phone: "+48 664 010 332",
    since: "2026-09-21",
    tags: ["new"],
    visits: 1,
    spent: 120,
  }),
  mkClient({
    id: "cl_aur_dawid",
    tenantId: "t_aurora",
    name: "Dawid Sokół",
    phone: "+48 606 774 130",
    since: "2023-11-27",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 27,
    spent: 1680,
    marketing: false,
    points: 60,
  }),
  mkClient({
    id: "cl_aur_zofia",
    tenantId: "t_aurora",
    name: "Zofia Rutkowska",
    phone: "+48 602 118 447",
    email: "z.rutkowska@example.com",
    since: "2022-06-03",
    tags: ["vip", "regular"],
    preferredStaffId: "stf_aur_kasia",
    visits: 48,
    spent: 12900,
    birthday: "1979-12-02",
    photos: true,
    photoCount: 11,
    points: 280,
  }),
  mkClient({
    id: "cl_aur_hania",
    tenantId: "t_aurora",
    name: "Hanna Michalak",
    phone: "+48 661 205 118",
    since: "2024-08-22",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 12,
    spent: 620,
    notes: L(
      "Przychodzi z synem Antkiem, 7 lat.",
      "Comes in with her son Antek, aged 7.",
      "Приходить із сином Антеком, 7 років.",
    ),
    points: 120,
  }),
  mkClient({
    id: "cl_aur_klara",
    tenantId: "t_aurora",
    name: "Klara Wójcik",
    phone: "+48 695 330 271",
    since: "2025-01-15",
    tags: ["regular"],
    preferredStaffId: "stf_aur_anna",
    visits: 10,
    spent: 1740,
    photoCount: 2,
    points: 100,
  }),
  mkClient({
    id: "cl_aur_robert",
    tenantId: "t_aurora",
    name: "Robert Jaworski",
    phone: "+48 603 812 440",
    since: "2024-02-19",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 19,
    spent: 1140,
    marketing: false,
    points: 80,
  }),
  mkClient({
    id: "cl_aur_filip",
    tenantId: "t_aurora",
    name: "Filip Sikorski",
    phone: "+48 517 442 006",
    since: "2025-09-08",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 7,
    spent: 420,
  }),
  mkClient({
    id: "cl_aur_adrian",
    tenantId: "t_aurora",
    name: "Adrian Kowal",
    phone: "+48 664 552 813",
    since: "2025-11-30",
    tags: ["regular"],
    preferredStaffId: "stf_aur_michal",
    visits: 5,
    spent: 300,
  }),
  mkClient({
    id: "cl_aur_wera",
    tenantId: "t_aurora",
    name: "Weronika Stasiak",
    phone: "+48 608 991 076",
    since: "2025-04-11",
    tags: ["regular"],
    preferredStaffId: "stf_aur_anna",
    visits: 8,
    spent: 1560,
    photoCount: 1,
    points: 80,
  }),
  mkClient({
    id: "cl_aur_sara",
    tenantId: "t_aurora",
    name: "Sara Krupa",
    phone: "+48 512 007 664",
    since: "2026-09-21",
    tags: ["new"],
    visits: 1,
    spent: 90,
  }),

  mkClient({
    id: "cl_fiz_julia",
    tenantId: "t_fizjo",
    name: "Julia Wiśniewska",
    phone: DEMO_CLIENT_PHONE,
    email: "julia.wisniewska@example.com",
    since: "2025-04-14",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_ewa",
    visits: 14,
    spent: 2380,
    birthday: "1994-06-08",
    notes: L(
      "Napięcie odcinka szyjnego, praca przy biurku 8 h dziennie.",
      "Neck tension, eight hours a day at a desk.",
      "Напруга шийного відділу, вісім годин на день за столом.",
    ),
  }),
  mkClient({
    id: "cl_fiz_marek",
    tenantId: "t_fizjo",
    name: "Marek Stelmach",
    phone: "+48 609 114 227",
    since: "2024-05-20",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_tomasz",
    visits: 26,
    spent: 5100,
    notes: L(
      "Dyskopatia L4–L5, bez technik trakcyjnych.",
      "L4–L5 disc issue, no traction techniques.",
      "Дископатія L4–L5, без тракційних технік.",
    ),
    alert: L(
      "Dyskopatia L4–L5",
      "L4–L5 disc issue",
      "Дископатія L4–L5",
    ),
  }),
  mkClient({
    id: "cl_fiz_ania",
    tenantId: "t_fizjo",
    name: "Anna Duda",
    phone: "+48 660 771 305",
    since: "2025-01-08",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_ewa",
    visits: 17,
    spent: 2890,
  }),
  mkClient({
    id: "cl_fiz_pawel",
    tenantId: "t_fizjo",
    name: "Paweł Rybak",
    phone: "+48 601 440 882",
    since: "2024-11-03",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_tomasz",
    visits: 21,
    spent: 4200,
    marketing: false,
  }),
  mkClient({
    id: "cl_fiz_gosia",
    tenantId: "t_fizjo",
    name: "Małgorzata Sadowska",
    phone: "+48 692 330 771",
    since: "2025-06-27",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_ewa",
    visits: 12,
    spent: 2040,
    birthday: "1983-09-23",
  }),
  mkClient({
    id: "cl_fiz_kuba",
    tenantId: "t_fizjo",
    name: "Jakub Wieczorek",
    phone: "+48 511 220 944",
    since: "2026-03-16",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_karolina",
    visits: 8,
    spent: 1520,
    notes: L(
      "Po rekonstrukcji ACL, 14. tydzień.",
      "Post ACL reconstruction, week 14.",
      "Після реконструкції ПКЗ, 14-й тиждень.",
    ),
  }),
  mkClient({
    id: "cl_fiz_ela",
    tenantId: "t_fizjo",
    name: "Elżbieta Tomczyk",
    phone: "+48 605 881 200",
    since: "2024-02-12",
    tags: ["vip", "regular"],
    preferredStaffId: "stf_fiz_piotr",
    visits: 33,
    spent: 7260,
  }),
  mkClient({
    id: "cl_fiz_adam",
    tenantId: "t_fizjo",
    name: "Adam Ostrowski",
    phone: "+48 664 007 118",
    email: "a.ostrowski@example.com",
    since: "2023-10-09",
    tags: ["vip", "regular"],
    preferredStaffId: "stf_fiz_piotr",
    visits: 38,
    spent: 8360,
  }),
  mkClient({
    id: "cl_fiz_wiktor",
    tenantId: "t_fizjo",
    name: "Wiktor Baran",
    phone: "+48 570 118 663",
    since: "2026-09-21",
    tags: ["new"],
    visits: 1,
    spent: 180,
  }),
  mkClient({
    id: "cl_fiz_sonia",
    tenantId: "t_fizjo",
    name: "Sonia Głowacka",
    phone: "+48 602 774 118",
    since: "2025-08-05",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_ewa",
    visits: 10,
    spent: 1640,
  }),
  mkClient({
    id: "cl_fiz_rafal",
    tenantId: "t_fizjo",
    name: "Rafał Jasiński",
    phone: "+48 608 330 552",
    since: "2025-03-19",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_ewa",
    visits: 15,
    spent: 2250,
    marketing: false,
  }),
  mkClient({
    id: "cl_fiz_dorota",
    tenantId: "t_fizjo",
    name: "Dorota Lis",
    phone: "+48 663 118 774",
    since: "2026-01-21",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_tomasz",
    visits: 6,
    spent: 840,
  }),
  mkClient({
    id: "cl_fiz_michal",
    tenantId: "t_fizjo",
    name: "Michał Urban",
    phone: "+48 601 990 443",
    since: "2025-10-14",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_piotr",
    visits: 9,
    spent: 1980,
  }),
  mkClient({
    id: "cl_fiz_iwona",
    tenantId: "t_fizjo",
    name: "Iwona Czarnecka",
    phone: "+48 695 118 003",
    since: "2025-12-02",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_karolina",
    visits: 11,
    spent: 2090,
  }),
  mkClient({
    id: "cl_fiz_oskar",
    tenantId: "t_fizjo",
    name: "Oskar Lewicki",
    phone: "+48 512 883 447",
    since: "2026-05-30",
    tags: ["regular"],
    preferredStaffId: "stf_fiz_karolina",
    visits: 5,
    spent: 950,
  }),
  mkClient({
    id: "cl_fiz_nina",
    tenantId: "t_fizjo",
    name: "Nina Sobczak",
    phone: "+48 604 220 118",
    since: "2026-09-14",
    tags: ["new"],
    preferredStaffId: "stf_fiz_karolina",
    visits: 2,
    spent: 240,
  }),

  mkClient({
    id: "cl_gar_julia",
    tenantId: "t_garaz",
    name: "Julia Wiśniewska",
    phone: DEMO_CLIENT_PHONE,
    email: "julia.wisniewska@example.com",
    since: "2025-10-28",
    tags: ["regular"],
    visits: 4,
    spent: 620,
    notes: L(
      "Toyota Yaris 2019, opony 185/65 R15.",
      "Toyota Yaris 2019, tyres 185/65 R15.",
      "Toyota Yaris 2019, шини 185/65 R15.",
    ),
  }),
  mkClient({
    id: "cl_gar_andrzej",
    tenantId: "t_garaz",
    name: "Andrzej Kaczmarek",
    phone: "+48 606 118 552",
    since: "2022-09-13",
    tags: ["vip", "regular"],
    preferredStaffId: "stf_gar_marek",
    visits: 29,
    spent: 9840,
    notes: L(
      "Volvo XC60 2017 — serwis co 15 tys. km.",
      "Volvo XC60 2017 — serviced every 15,000 km.",
      "Volvo XC60 2017 — сервіс кожні 15 тис. км.",
    ),
  }),
  mkClient({
    id: "cl_gar_sylwia",
    tenantId: "t_garaz",
    name: "Sylwia Borkowska",
    phone: "+48 663 447 002",
    since: "2024-04-06",
    tags: ["regular"],
    visits: 11,
    spent: 3260,
  }),
  mkClient({
    id: "cl_gar_krzysztof",
    tenantId: "t_garaz",
    name: "Krzysztof Malinowski",
    phone: "+48 601 220 881",
    since: "2023-02-18",
    tags: ["regular"],
    preferredStaffId: "stf_gar_marek",
    visits: 18,
    spent: 6120,
    marketing: false,
  }),
  mkClient({
    id: "cl_gar_lukasz",
    tenantId: "t_garaz",
    name: "Łukasz Cieślak",
    phone: "+48 512 118 330",
    since: "2025-03-22",
    tags: ["regular"],
    visits: 8,
    spent: 1480,
  }),
  mkClient({
    id: "cl_gar_beata",
    tenantId: "t_garaz",
    name: "Beata Wrona",
    phone: "+48 695 771 004",
    since: "2025-11-09",
    tags: ["regular"],
    visits: 5,
    spent: 760,
  }),
  mkClient({
    id: "cl_gar_damian",
    tenantId: "t_garaz",
    name: "Damian Zawadzki",
    phone: "+48 608 003 771",
    since: "2024-07-30",
    tags: ["regular"],
    preferredStaffId: "stf_gar_darek",
    visits: 13,
    spent: 3940,
  }),
  mkClient({
    id: "cl_gar_grzegorz",
    tenantId: "t_garaz",
    name: "Grzegorz Pietrzak",
    phone: "+48 604 881 220",
    since: "2026-02-14",
    tags: ["regular"],
    visits: 4,
    spent: 430,
    marketing: false,
  }),
  mkClient({
    id: "cl_gar_monika",
    tenantId: "t_garaz",
    name: "Monika Sowa",
    phone: "+48 660 330 118",
    since: "2026-09-12",
    tags: ["new"],
    visits: 2,
    spent: 270,
  }),
];

/** Every client record that belongs to the demo persona. */
export const DEMO_CLIENT_IDS = SEED_CLIENTS.filter(
  (c) => c.phone === DEMO_CLIENT_PHONE,
).map((c) => c.id);

export const DEMO_CLIENT_ACCOUNT: Account = {
  id: "acc_client_demo",
  kind: "client",
  name: "Julia Wiśniewska",
  initials: "JW",
  email: "julia.wisniewska@example.com",
  phone: DEMO_CLIENT_PHONE,
  city: "Wrocław",
  locale: "pl",
};

export const DEMO_COMPANY_ACCOUNTS: Record<string, Account> = {
  t_aurora: {
    id: "acc_company_aurora",
    kind: "company",
    name: "Anna Kowalczyk",
    initials: "AK",
    email: "anna@studioaurora.pl",
    phone: "+48 601 234 567",
    tenantId: "t_aurora",
    city: "Wrocław",
    locale: "pl",
  },
  t_fizjo: {
    id: "acc_company_fizjo",
    kind: "company",
    name: "Tomasz Lis",
    initials: "TL",
    email: "tomasz@fizjobalans.pl",
    phone: "+48 606 880 114",
    tenantId: "t_fizjo",
    city: "Wrocław",
    locale: "pl",
  },
  t_garaz: {
    id: "acc_company_garaz",
    kind: "company",
    name: "Marek Kowal",
    initials: "MK",
    email: "marek@garaz44.pl",
    phone: "+48 512 770 044",
    tenantId: "t_garaz",
    city: "Wrocław",
    locale: "pl",
  },
};

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

interface ApptSpec {
  id: string;
  t: string;
  c: string;
  s: string;
  svc: string[];
  room?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  pay: PaymentStatus;
  src: BookingSource;
  note?: string;
  first?: boolean;
  sms?: boolean;
  deposit?: number;
  fields?: Record<string, string>;
  membershipId?: string;
  minutes?: number;
}

function appt(spec: ApptSpec): Appointment {
  const services = spec.svc
    .map((id) => SERVICE_INDEX.get(id))
    .filter((s): s is Service => Boolean(s));
  const minutes = spec.minutes ?? sum(services.map((s) => s.durationMin));
  const start = `${spec.date}T${spec.time}:00`;
  return {
    id: spec.id,
    tenantId: spec.t,
    clientId: spec.c,
    staffId: spec.s,
    serviceIds: spec.svc,
    roomId: spec.room,
    start,
    end: addMinutes(start, minutes || 30),
    status: spec.status,
    payment: spec.pay,
    depositAmount: spec.deposit,
    total: sum(services.map((s) => s.price)),
    source: spec.src,
    note: spec.note,
    smsReminderSent: spec.sms,
    isFirstVisit: spec.first,
    customFields: spec.fields,
    membershipId: spec.membershipId,
  };
}

const CAR_VOLVO = { car: "Volvo XC60", plate: "DW 4412K", year: "2017", tyres: "235/60 R18" };
const CAR_YARIS = { car: "Toyota Yaris", plate: "DW 9021M", year: "2019", tyres: "185/65 R15" };
const CAR_OCTAVIA = { car: "Škoda Octavia III", plate: "DW 7710P", year: "2018", tyres: "205/55 R16" };
const CAR_GOLF = { car: "VW Golf VII", plate: "DW 3308T", year: "2016", tyres: "205/55 R16" };
const CAR_FOCUS = { car: "Ford Focus", plate: "DW 5521A", year: "2015", tyres: "195/65 R15" };
const CAR_CEED = { car: "Kia Ceed", plate: "DW 8834R", year: "2021", tyres: "205/55 R16" };
const CAR_PASSAT = { car: "VW Passat B8", plate: "DW 1177S", year: "2019", tyres: "215/55 R17" };
const CAR_CORSA = { car: "Opel Corsa", plate: "DW 6640W", year: "2014", tyres: "185/60 R15" };

/* --- Studio Aurora, Monday 21 September (today) -------------------- */

const AURORA_TODAY: Appointment[] = [
  appt({ id: "a_aur_0921_01", t: "t_aurora", c: "cl_aur_ewa", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-21", time: "08:00", status: "done", pay: "paid", src: "app", sms: true }),
  appt({ id: "a_aur_0921_02", t: "t_aurora", c: "cl_aur_kinga", s: "stf_aur_ola", svc: ["svc_aur_blowdry"], room: "rm_aur_1", date: "2026-09-21", time: "09:15", status: "done", pay: "paid", src: "phone", sms: true }),
  appt({ id: "a_aur_0921_03", t: "t_aurora", c: "cl_aur_marta", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-21", time: "10:30", status: "in-progress", pay: "unpaid", src: "app", note: "Urodziny w tym tygodniu — rabat 10%.", sms: true }),
  appt({ id: "a_aur_0921_04", t: "t_aurora", c: "cl_aur_julia", s: "stf_aur_ola", svc: ["svc_aur_cut_w", "svc_aur_mask"], room: "rm_aur_1", date: "2026-09-21", time: "12:30", status: "confirmed", pay: "deposit", deposit: 32, src: "app", sms: true }),
  appt({ id: "a_aur_0921_05", t: "t_aurora", c: "cl_aur_lena", s: "stf_aur_ola", svc: ["svc_aur_style"], room: "rm_aur_1", date: "2026-09-21", time: "14:30", status: "confirmed", pay: "deposit", deposit: 30, src: "site" }),
  appt({ id: "a_aur_0921_06", t: "t_aurora", c: "cl_aur_hania", s: "stf_aur_ola", svc: ["svc_aur_cut_kid"], room: "rm_aur_1", date: "2026-09-21", time: "15:45", status: "confirmed", pay: "unpaid", src: "phone", note: "Antek, 7 lat — grzywka na bok." }),
  appt({ id: "a_aur_0921_07", t: "t_aurora", c: "cl_aur_iga", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-21", time: "17:00", status: "pending", pay: "unpaid", src: "instagram", first: true }),

  appt({ id: "a_aur_0921_08", t: "t_aurora", c: "cl_aur_magda", s: "stf_aur_kasia", svc: ["svc_aur_color"], room: "rm_aur_2", date: "2026-09-21", time: "08:30", status: "done", pay: "paid", src: "app", note: "Farba bezamoniakalna." }),
  appt({ id: "a_aur_0921_09", t: "t_aurora", c: "cl_aur_natalia", s: "stf_aur_kasia", svc: ["svc_aur_roots"], room: "rm_aur_2", date: "2026-09-21", time: "11:30", status: "confirmed", pay: "unpaid", src: "google" }),
  appt({ id: "a_aur_0921_10", t: "t_aurora", c: "cl_aur_ala", s: "stf_aur_kasia", svc: ["svc_aur_balayage"], room: "rm_aur_2", date: "2026-09-21", time: "13:15", status: "confirmed", pay: "deposit", deposit: 84, src: "app", sms: true }),
  appt({ id: "a_aur_0921_11", t: "t_aurora", c: "cl_aur_zofia", s: "stf_aur_kasia", svc: ["svc_aur_olaplex"], room: "rm_aur_2", date: "2026-09-21", time: "16:30", status: "pending", pay: "unpaid", src: "site" }),

  appt({ id: "a_aur_0921_12", t: "t_aurora", c: "cl_aur_piotr", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "08:00", status: "done", pay: "paid", src: "walk-in" }),
  appt({ id: "a_aur_0921_13", t: "t_aurora", c: "cl_aur_dawid", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "08:30", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0921_14", t: "t_aurora", c: "cl_aur_robert", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "09:15", status: "done", pay: "paid", src: "app", sms: true }),
  appt({ id: "a_aur_0921_15", t: "t_aurora", c: "cl_aur_tomek", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "10:00", status: "done", pay: "paid", src: "google", first: true }),
  appt({ id: "a_aur_0921_16", t: "t_aurora", c: "cl_aur_klara", s: "stf_aur_michal", svc: ["svc_aur_cut_kid"], room: "rm_aur_3", date: "2026-09-21", time: "10:30", status: "done", pay: "paid", src: "phone" }),
  appt({ id: "a_aur_0921_17", t: "t_aurora", c: "cl_aur_bartek", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "11:15", status: "no-show", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0921_18", t: "t_aurora", c: "cl_aur_filip", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "12:00", status: "confirmed", pay: "unpaid", src: "walk-in" }),
  appt({ id: "a_aur_0921_19", t: "t_aurora", c: "cl_aur_adrian", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-21", time: "13:00", status: "confirmed", pay: "unpaid", src: "app" }),

  appt({ id: "a_aur_0921_20", t: "t_aurora", c: "cl_aur_olga", s: "stf_aur_anna", svc: ["svc_aur_keratin"], room: "rm_aur_4", date: "2026-09-21", time: "09:00", status: "done", pay: "paid", src: "app", sms: true }),
  appt({ id: "a_aur_0921_21", t: "t_aurora", c: "cl_aur_wera", s: "stf_aur_anna", svc: ["svc_aur_cut_w"], room: "rm_aur_4", date: "2026-09-21", time: "13:30", status: "confirmed", pay: "deposit", deposit: 24, src: "app" }),
  appt({ id: "a_aur_0921_22", t: "t_aurora", c: "cl_aur_sara", s: "stf_aur_anna", svc: ["svc_aur_olaplex"], room: "rm_aur_4", date: "2026-09-21", time: "15:00", status: "pending", pay: "unpaid", src: "instagram", first: true }),
];

/* --- Studio Aurora, Tuesday 22 September --------------------------- */

const AURORA_TOMORROW: Appointment[] = [
  appt({ id: "a_aur_0922_01", t: "t_aurora", c: "cl_aur_zofia", s: "stf_aur_ola", svc: ["svc_aur_blowdry"], room: "rm_aur_1", date: "2026-09-22", time: "08:30", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0922_02", t: "t_aurora", c: "cl_aur_klara", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-22", time: "09:30", status: "confirmed", pay: "deposit", deposit: 24, src: "app" }),
  appt({ id: "a_aur_0922_03", t: "t_aurora", c: "cl_aur_natalia", s: "stf_aur_ola", svc: ["svc_aur_cut_w", "svc_aur_mask"], room: "rm_aur_1", date: "2026-09-22", time: "11:00", status: "confirmed", pay: "unpaid", src: "site" }),
  appt({ id: "a_aur_0922_04", t: "t_aurora", c: "cl_aur_marta", s: "stf_aur_ola", svc: ["svc_aur_style"], room: "rm_aur_1", date: "2026-09-22", time: "13:00", status: "confirmed", pay: "deposit", deposit: 30, src: "app", note: "Próba fryzury ślubnej." }),
  appt({ id: "a_aur_0922_05", t: "t_aurora", c: "cl_aur_hania", s: "stf_aur_ola", svc: ["svc_aur_cut_kid"], room: "rm_aur_1", date: "2026-09-22", time: "14:30", status: "pending", pay: "unpaid", src: "phone" }),

  appt({ id: "a_aur_0922_06", t: "t_aurora", c: "cl_aur_julia", s: "stf_aur_kasia", svc: ["svc_aur_balayage"], room: "rm_aur_2", date: "2026-09-22", time: "09:00", status: "confirmed", pay: "deposit", deposit: 84, src: "app", sms: true }),
  appt({ id: "a_aur_0922_07", t: "t_aurora", c: "cl_aur_ewa", s: "stf_aur_kasia", svc: ["svc_aur_roots"], room: "rm_aur_2", date: "2026-09-22", time: "12:30", status: "confirmed", pay: "unpaid", src: "phone" }),
  appt({ id: "a_aur_0922_08", t: "t_aurora", c: "cl_aur_lena", s: "stf_aur_kasia", svc: ["svc_aur_color"], room: "rm_aur_2", date: "2026-09-22", time: "14:15", status: "confirmed", pay: "deposit", deposit: 50, src: "app" }),

  appt({ id: "a_aur_0922_09", t: "t_aurora", c: "cl_aur_dawid", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-22", time: "08:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0922_10", t: "t_aurora", c: "cl_aur_filip", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-22", time: "08:45", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0922_11", t: "t_aurora", c: "cl_aur_adrian", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-22", time: "10:00", status: "confirmed", pay: "unpaid", src: "walk-in" }),
  appt({ id: "a_aur_0922_12", t: "t_aurora", c: "cl_aur_robert", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-22", time: "11:00", status: "pending", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0922_13", t: "t_aurora", c: "cl_aur_tomek", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-22", time: "12:00", status: "confirmed", pay: "unpaid", src: "google" }),

  appt({ id: "a_aur_0922_14", t: "t_aurora", c: "cl_aur_ala", s: "stf_aur_anna", svc: ["svc_aur_keratin"], room: "rm_aur_4", date: "2026-09-22", time: "10:00", status: "confirmed", pay: "deposit", deposit: 76, src: "app" }),
  appt({ id: "a_aur_0922_15", t: "t_aurora", c: "cl_aur_kinga", s: "stf_aur_anna", svc: ["svc_aur_cut_w"], room: "rm_aur_4", date: "2026-09-22", time: "13:00", status: "confirmed", pay: "unpaid", src: "site" }),
];

/* --- Fizjo Balans, Monday 21 September ----------------------------- */

const FIZJO_TODAY: Appointment[] = [
  appt({ id: "a_fiz_0921_01", t: "t_fizjo", c: "cl_fiz_marek", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-21", time: "08:00", status: "done", pay: "paid", src: "app", fields: { pain_area: "Kręgosłup lędźwiowy", pain_scale: "6" }, sms: true }),
  appt({ id: "a_fiz_0921_02", t: "t_fizjo", c: "cl_fiz_pawel", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-21", time: "09:00", status: "done", pay: "paid", src: "app", fields: { pain_area: "Bark", pain_scale: "4" } }),
  appt({ id: "a_fiz_0921_03", t: "t_fizjo", c: "cl_fiz_ania", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-21", time: "10:00", status: "done", pay: "paid", src: "phone", fields: { pain_area: "Kręgosłup szyjny", pain_scale: "5" } }),
  appt({ id: "a_fiz_0921_04", t: "t_fizjo", c: "cl_fiz_kuba", s: "stf_fiz_tomasz", svc: ["svc_fiz_rehab"], room: "rm_fiz_1", date: "2026-09-21", time: "11:00", status: "in-progress", pay: "unpaid", src: "app", fields: { pain_area: "Kolano", pain_scale: "3" }, note: "ACL, 14. tydzień — progresja przysiadu." }),
  appt({ id: "a_fiz_0921_05", t: "t_fizjo", c: "cl_fiz_wiktor", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-21", time: "13:00", status: "confirmed", pay: "deposit", deposit: 50, src: "google", first: true, fields: { pain_area: "Kręgosłup piersiowy", pain_scale: "7" } }),
  appt({ id: "a_fiz_0921_06", t: "t_fizjo", c: "cl_fiz_dorota", s: "stf_fiz_tomasz", svc: ["svc_fiz_online"], date: "2026-09-21", time: "14:00", status: "confirmed", pay: "paid", src: "app", fields: { pain_area: "Inne" }, sms: true }),

  appt({ id: "a_fiz_0921_07", t: "t_fizjo", c: "cl_fiz_gosia", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-21", time: "08:30", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0921_08", t: "t_fizjo", c: "cl_fiz_rafal", s: "stf_fiz_ewa", svc: ["svc_fiz_sport"], room: "rm_fiz_2", date: "2026-09-21", time: "09:45", status: "done", pay: "paid", src: "phone" }),
  appt({ id: "a_fiz_0921_09", t: "t_fizjo", c: "cl_fiz_julia", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-21", time: "11:00", status: "confirmed", pay: "paid", src: "app", membershipId: "mb_fiz_julia", sms: true }),
  appt({ id: "a_fiz_0921_10", t: "t_fizjo", c: "cl_fiz_sonia", s: "stf_fiz_ewa", svc: ["svc_fiz_sport"], room: "rm_fiz_2", date: "2026-09-21", time: "12:30", status: "confirmed", pay: "unpaid", src: "site" }),

  appt({ id: "a_fiz_0921_11", t: "t_fizjo", c: "cl_fiz_adam", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-21", time: "13:30", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0921_12", t: "t_fizjo", c: "cl_fiz_michal", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-21", time: "15:00", status: "confirmed", pay: "deposit", deposit: 50, src: "app" }),
  appt({ id: "a_fiz_0921_13", t: "t_fizjo", c: "cl_fiz_ela", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-21", time: "16:15", status: "pending", pay: "unpaid", src: "phone" }),

  appt({ id: "a_fiz_0921_14", t: "t_fizjo", c: "cl_fiz_iwona", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-21", time: "08:30", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0921_15", t: "t_fizjo", c: "cl_fiz_oskar", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-21", time: "09:30", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0921_16", t: "t_fizjo", c: "cl_fiz_nina", s: "stf_fiz_karolina", svc: ["svc_fiz_consult"], room: "rm_fiz_3", date: "2026-09-21", time: "10:30", status: "done", pay: "deposit", deposit: 50, src: "google", first: true, fields: { pain_area: "Biodro", pain_scale: "4" } }),
  appt({ id: "a_fiz_0921_17", t: "t_fizjo", c: "cl_fiz_nina", s: "stf_fiz_karolina", svc: ["svc_fiz_pilates"], room: "rm_fiz_3", date: "2026-09-21", time: "12:00", status: "confirmed", pay: "paid", src: "app", note: "Grupa 5/8 osób." }),
  appt({ id: "a_fiz_0921_18", t: "t_fizjo", c: "cl_fiz_ela", s: "stf_fiz_karolina", svc: ["svc_fiz_pilates"], room: "rm_fiz_3", date: "2026-09-21", time: "17:00", status: "confirmed", pay: "unpaid", src: "site", note: "Grupa 3/8 osób." }),
];

/* --- Fizjo Balans, Tuesday 22 September ---------------------------- */

const FIZJO_TOMORROW: Appointment[] = [
  appt({ id: "a_fiz_0922_01", t: "t_fizjo", c: "cl_fiz_sonia", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-22", time: "08:00", status: "confirmed", pay: "deposit", deposit: 50, src: "app", fields: { pain_area: "Kręgosłup szyjny", pain_scale: "5" } }),
  appt({ id: "a_fiz_0922_02", t: "t_fizjo", c: "cl_fiz_marek", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-22", time: "09:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0922_03", t: "t_fizjo", c: "cl_fiz_iwona", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual", "svc_fiz_needle"], room: "rm_fiz_1", date: "2026-09-22", time: "10:00", status: "confirmed", pay: "unpaid", src: "phone" }),
  appt({ id: "a_fiz_0922_04", t: "t_fizjo", c: "cl_fiz_michal", s: "stf_fiz_tomasz", svc: ["svc_fiz_online"], date: "2026-09-22", time: "11:30", status: "confirmed", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0922_05", t: "t_fizjo", c: "cl_fiz_pawel", s: "stf_fiz_tomasz", svc: ["svc_fiz_rehab"], room: "rm_fiz_1", date: "2026-09-22", time: "13:00", status: "confirmed", pay: "unpaid", src: "app" }),

  appt({ id: "a_fiz_0922_06", t: "t_fizjo", c: "cl_fiz_ania", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-22", time: "09:00", status: "confirmed", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0922_07", t: "t_fizjo", c: "cl_fiz_dorota", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-22", time: "10:15", status: "confirmed", pay: "unpaid", src: "site" }),
  appt({ id: "a_fiz_0922_08", t: "t_fizjo", c: "cl_fiz_rafal", s: "stf_fiz_ewa", svc: ["svc_fiz_sport"], room: "rm_fiz_2", date: "2026-09-22", time: "11:30", status: "confirmed", pay: "unpaid", src: "app" }),

  appt({ id: "a_fiz_0922_09", t: "t_fizjo", c: "cl_fiz_adam", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-22", time: "13:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0922_10", t: "t_fizjo", c: "cl_fiz_oskar", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-22", time: "14:15", status: "pending", pay: "unpaid", src: "google" }),

  appt({ id: "a_fiz_0922_11", t: "t_fizjo", c: "cl_fiz_kuba", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-22", time: "08:30", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0922_12", t: "t_fizjo", c: "cl_fiz_nina", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-22", time: "10:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0922_13", t: "t_fizjo", c: "cl_fiz_ela", s: "stf_fiz_karolina", svc: ["svc_fiz_pilates"], room: "rm_fiz_3", date: "2026-09-22", time: "12:00", status: "confirmed", pay: "paid", src: "site" }),
];

/* --- Garaż 44, 21–22 September ------------------------------------- */

const GARAZ_TODAY: Appointment[] = [
  appt({ id: "a_gar_0921_01", t: "t_garaz", c: "cl_gar_andrzej", s: "stf_gar_marek", svc: ["svc_gar_oil"], room: "rm_gar_1", date: "2026-09-21", time: "08:00", status: "done", pay: "paid", src: "phone", fields: CAR_VOLVO }),
  appt({ id: "a_gar_0921_02", t: "t_garaz", c: "cl_gar_sylwia", s: "stf_gar_marek", svc: ["svc_gar_service"], room: "rm_gar_1", date: "2026-09-21", time: "09:30", status: "done", pay: "paid", src: "app", fields: CAR_CEED }),
  appt({ id: "a_gar_0921_03", t: "t_garaz", c: "cl_gar_krzysztof", s: "stf_gar_marek", svc: ["svc_gar_susp"], room: "rm_gar_1", date: "2026-09-21", time: "11:00", status: "in-progress", pay: "unpaid", src: "phone", fields: CAR_PASSAT, note: "Stuk z przodu po prawej — wahacz." }),
  appt({ id: "a_gar_0921_04", t: "t_garaz", c: "cl_gar_monika", s: "stf_gar_marek", svc: ["svc_gar_diag"], room: "rm_gar_1", date: "2026-09-21", time: "14:30", status: "confirmed", pay: "unpaid", src: "site", fields: CAR_CORSA }),

  appt({ id: "a_gar_0921_05", t: "t_garaz", c: "cl_gar_lukasz", s: "stf_gar_darek", svc: ["svc_gar_tyres_bal"], room: "rm_gar_2", date: "2026-09-21", time: "08:30", status: "done", pay: "paid", src: "walk-in", fields: CAR_FOCUS }),
  appt({ id: "a_gar_0921_06", t: "t_garaz", c: "cl_gar_beata", s: "stf_gar_darek", svc: ["svc_gar_tyres"], room: "rm_gar_2", date: "2026-09-21", time: "10:00", status: "done", pay: "paid", src: "app", fields: CAR_GOLF }),
  appt({ id: "a_gar_0921_07", t: "t_garaz", c: "cl_gar_damian", s: "stf_gar_darek", svc: ["svc_gar_ac"], room: "rm_gar_2", date: "2026-09-21", time: "11:00", status: "confirmed", pay: "unpaid", src: "google", fields: CAR_OCTAVIA }),
  appt({ id: "a_gar_0921_08", t: "t_garaz", c: "cl_gar_julia", s: "stf_gar_darek", svc: ["svc_gar_tyres"], room: "rm_gar_2", date: "2026-09-21", time: "13:00", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_YARIS, sms: true }),

  appt({ id: "a_gar_0921_09", t: "t_garaz", c: "cl_gar_grzegorz", s: "stf_gar_bartek", svc: ["svc_gar_puncture"], date: "2026-09-21", time: "12:00", status: "done", pay: "paid", src: "walk-in", fields: CAR_CORSA }),
];

const GARAZ_TOMORROW: Appointment[] = [
  appt({ id: "a_gar_0922_01", t: "t_garaz", c: "cl_gar_damian", s: "stf_gar_marek", svc: ["svc_gar_service"], room: "rm_gar_1", date: "2026-09-22", time: "08:00", status: "confirmed", pay: "unpaid", src: "phone", fields: CAR_OCTAVIA }),
  appt({ id: "a_gar_0922_02", t: "t_garaz", c: "cl_gar_grzegorz", s: "stf_gar_marek", svc: ["svc_gar_oil"], room: "rm_gar_1", date: "2026-09-22", time: "10:00", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_CORSA }),
  appt({ id: "a_gar_0922_03", t: "t_garaz", c: "cl_gar_lukasz", s: "stf_gar_marek", svc: ["svc_gar_diag"], room: "rm_gar_1", date: "2026-09-22", time: "13:00", status: "confirmed", pay: "unpaid", src: "site", fields: CAR_FOCUS }),
  appt({ id: "a_gar_0922_04", t: "t_garaz", c: "cl_gar_monika", s: "stf_gar_darek", svc: ["svc_gar_tyres"], room: "rm_gar_2", date: "2026-09-22", time: "08:30", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_CORSA }),
  appt({ id: "a_gar_0922_05", t: "t_garaz", c: "cl_gar_andrzej", s: "stf_gar_darek", svc: ["svc_gar_tyres_bal"], room: "rm_gar_2", date: "2026-09-22", time: "09:30", status: "confirmed", pay: "unpaid", src: "phone", fields: CAR_VOLVO }),
  appt({ id: "a_gar_0922_06", t: "t_garaz", c: "cl_gar_sylwia", s: "stf_gar_bartek", svc: ["svc_gar_storage"], date: "2026-09-22", time: "11:00", status: "pending", pay: "unpaid", src: "app", fields: CAR_CEED }),
];

/* --- Past week: 14–19 September ------------------------------------ */

const PAST: Appointment[] = [
  appt({ id: "a_aur_0914_01", t: "t_aurora", c: "cl_aur_julia", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-14", time: "10:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0914_02", t: "t_aurora", c: "cl_aur_magda", s: "stf_aur_kasia", svc: ["svc_aur_color"], room: "rm_aur_2", date: "2026-09-14", time: "09:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0914_03", t: "t_aurora", c: "cl_aur_piotr", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-14", time: "11:00", status: "done", pay: "paid", src: "walk-in" }),
  appt({ id: "a_aur_0915_01", t: "t_aurora", c: "cl_aur_ewa", s: "stf_aur_ola", svc: ["svc_aur_blowdry"], room: "rm_aur_1", date: "2026-09-15", time: "09:00", status: "done", pay: "paid", src: "phone" }),
  appt({ id: "a_aur_0915_02", t: "t_aurora", c: "cl_aur_zofia", s: "stf_aur_anna", svc: ["svc_aur_keratin"], room: "rm_aur_4", date: "2026-09-15", time: "12:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0916_01", t: "t_aurora", c: "cl_aur_dawid", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-16", time: "08:30", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0916_02", t: "t_aurora", c: "cl_aur_lena", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-16", time: "14:00", status: "cancelled", pay: "unpaid", src: "app", note: "Odwołane przez klientkę, 4 h przed wizytą." }),
  appt({ id: "a_aur_0917_01", t: "t_aurora", c: "cl_aur_natalia", s: "stf_aur_kasia", svc: ["svc_aur_roots"], room: "rm_aur_2", date: "2026-09-17", time: "10:00", status: "done", pay: "paid", src: "google", first: true }),
  appt({ id: "a_aur_0917_02", t: "t_aurora", c: "cl_aur_hania", s: "stf_aur_ola", svc: ["svc_aur_cut_kid"], room: "rm_aur_1", date: "2026-09-17", time: "11:00", status: "done", pay: "paid", src: "phone" }),
  appt({ id: "a_aur_0918_01", t: "t_aurora", c: "cl_aur_bartek", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-18", time: "09:00", status: "no-show", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0918_02", t: "t_aurora", c: "cl_aur_marta", s: "stf_aur_ola", svc: ["svc_aur_cut_w", "svc_aur_mask"], room: "rm_aur_1", date: "2026-09-18", time: "13:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_aur_0919_01", t: "t_aurora", c: "cl_aur_klara", s: "stf_aur_ola", svc: ["svc_aur_style"], room: "rm_aur_1", date: "2026-09-19", time: "10:00", status: "done", pay: "paid", src: "instagram" }),
  appt({ id: "a_aur_0919_02", t: "t_aurora", c: "cl_aur_robert", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-19", time: "11:00", status: "done", pay: "paid", src: "walk-in" }),

  appt({ id: "a_fiz_0914_01", t: "t_fizjo", c: "cl_fiz_marek", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-14", time: "09:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0914_02", t: "t_fizjo", c: "cl_fiz_gosia", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-14", time: "11:00", status: "done", pay: "paid", src: "phone" }),
  appt({ id: "a_fiz_0915_01", t: "t_fizjo", c: "cl_fiz_pawel", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-15", time: "10:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0915_02", t: "t_fizjo", c: "cl_fiz_iwona", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-15", time: "09:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0916_01", t: "t_fizjo", c: "cl_fiz_adam", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-16", time: "14:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0916_02", t: "t_fizjo", c: "cl_fiz_rafal", s: "stf_fiz_ewa", svc: ["svc_fiz_sport"], room: "rm_fiz_2", date: "2026-09-16", time: "10:00", status: "done", pay: "paid", src: "site" }),
  appt({ id: "a_fiz_0917_01", t: "t_fizjo", c: "cl_fiz_ania", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-17", time: "08:00", status: "done", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0917_02", t: "t_fizjo", c: "cl_fiz_nina", s: "stf_fiz_karolina", svc: ["svc_fiz_pilates"], room: "rm_fiz_3", date: "2026-09-17", time: "12:00", status: "done", pay: "paid", src: "google", first: true }),
  appt({ id: "a_fiz_0918_01", t: "t_fizjo", c: "cl_fiz_kuba", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-18", time: "11:00", status: "cancelled", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0918_02", t: "t_fizjo", c: "cl_fiz_julia", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-18", time: "13:00", status: "done", pay: "paid", src: "app", membershipId: "mb_fiz_julia" }),
  appt({ id: "a_fiz_0919_01", t: "t_fizjo", c: "cl_fiz_oskar", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-09-19", time: "10:00", status: "done", pay: "paid", src: "app" }),

  appt({ id: "a_gar_0915_01", t: "t_garaz", c: "cl_gar_andrzej", s: "stf_gar_marek", svc: ["svc_gar_oil"], room: "rm_gar_1", date: "2026-09-15", time: "09:00", status: "done", pay: "paid", src: "phone", fields: CAR_VOLVO }),
  appt({ id: "a_gar_0916_01", t: "t_garaz", c: "cl_gar_beata", s: "stf_gar_darek", svc: ["svc_gar_tyres"], room: "rm_gar_2", date: "2026-09-16", time: "10:00", status: "done", pay: "paid", src: "app", fields: CAR_GOLF }),
  appt({ id: "a_gar_0917_01", t: "t_garaz", c: "cl_gar_krzysztof", s: "stf_gar_marek", svc: ["svc_gar_service"], room: "rm_gar_1", date: "2026-09-17", time: "11:00", status: "done", pay: "paid", src: "phone", fields: CAR_PASSAT }),
  appt({ id: "a_gar_0918_01", t: "t_garaz", c: "cl_gar_grzegorz", s: "stf_gar_bartek", svc: ["svc_gar_puncture"], date: "2026-09-18", time: "09:00", status: "done", pay: "paid", src: "walk-in", fields: CAR_CORSA }),
  appt({ id: "a_gar_0919_01", t: "t_garaz", c: "cl_gar_lukasz", s: "stf_gar_darek", svc: ["svc_gar_tyres_bal"], room: "rm_gar_2", date: "2026-09-19", time: "10:00", status: "done", pay: "paid", src: "app", fields: CAR_FOCUS }),
];

/* --- Upcoming: 23 September – 3 October ---------------------------- */

const FUTURE: Appointment[] = [
  appt({ id: "a_aur_0923_01", t: "t_aurora", c: "cl_aur_ewa", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-23", time: "09:00", status: "confirmed", pay: "deposit", deposit: 24, src: "app" }),
  appt({ id: "a_aur_0923_02", t: "t_aurora", c: "cl_aur_zofia", s: "stf_aur_kasia", svc: ["svc_aur_color"], room: "rm_aur_2", date: "2026-09-23", time: "11:00", status: "confirmed", pay: "deposit", deposit: 50, src: "app" }),
  appt({ id: "a_aur_0923_03", t: "t_aurora", c: "cl_aur_piotr", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-23", time: "08:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0924_01", t: "t_aurora", c: "cl_aur_julia", s: "stf_aur_ola", svc: ["svc_aur_cut_w", "svc_aur_mask"], room: "rm_aur_1", date: "2026-09-24", time: "10:00", status: "confirmed", pay: "deposit", deposit: 32, src: "app" }),
  appt({ id: "a_aur_0924_02", t: "t_aurora", c: "cl_aur_wera", s: "stf_aur_anna", svc: ["svc_aur_keratin"], room: "rm_aur_4", date: "2026-09-24", time: "13:00", status: "pending", pay: "unpaid", src: "site" }),
  appt({ id: "a_aur_0925_01", t: "t_aurora", c: "cl_aur_dawid", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-25", time: "09:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0925_02", t: "t_aurora", c: "cl_aur_ala", s: "stf_aur_kasia", svc: ["svc_aur_balayage", "svc_aur_olaplex"], room: "rm_aur_2", date: "2026-09-25", time: "10:00", status: "confirmed", pay: "deposit", deposit: 102, src: "app" }),
  appt({ id: "a_aur_0926_01", t: "t_aurora", c: "cl_aur_lena", s: "stf_aur_ola", svc: ["svc_aur_style"], room: "rm_aur_1", date: "2026-09-26", time: "11:00", status: "confirmed", pay: "deposit", deposit: 30, src: "site" }),
  appt({ id: "a_aur_0928_01", t: "t_aurora", c: "cl_aur_kinga", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-09-28", time: "09:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_0928_02", t: "t_aurora", c: "cl_aur_robert", s: "stf_aur_michal", svc: ["svc_aur_cut_m"], room: "rm_aur_3", date: "2026-09-28", time: "10:00", status: "pending", pay: "unpaid", src: "google" }),
  appt({ id: "a_aur_0930_01", t: "t_aurora", c: "cl_aur_natalia", s: "stf_aur_kasia", svc: ["svc_aur_roots"], room: "rm_aur_2", date: "2026-09-30", time: "09:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_aur_1002_01", t: "t_aurora", c: "cl_aur_marta", s: "stf_aur_ola", svc: ["svc_aur_cut_w"], room: "rm_aur_1", date: "2026-10-02", time: "12:00", status: "pending", pay: "unpaid", src: "instagram" }),
  appt({ id: "a_aur_1003_01", t: "t_aurora", c: "cl_aur_hania", s: "stf_aur_michal", svc: ["svc_aur_cut_kid"], room: "rm_aur_3", date: "2026-10-03", time: "10:00", status: "confirmed", pay: "unpaid", src: "phone" }),

  appt({ id: "a_fiz_0923_01", t: "t_fizjo", c: "cl_fiz_pawel", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-09-23", time: "09:00", status: "confirmed", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0923_02", t: "t_fizjo", c: "cl_fiz_julia", s: "stf_fiz_ewa", svc: ["svc_fiz_massage"], room: "rm_fiz_2", date: "2026-09-23", time: "11:00", status: "confirmed", pay: "paid", src: "app", membershipId: "mb_fiz_julia" }),
  appt({ id: "a_fiz_0924_01", t: "t_fizjo", c: "cl_fiz_wiktor", s: "stf_fiz_tomasz", svc: ["svc_fiz_consult"], room: "rm_fiz_1", date: "2026-09-24", time: "10:00", status: "confirmed", pay: "deposit", deposit: 50, src: "google" }),
  appt({ id: "a_fiz_0924_02", t: "t_fizjo", c: "cl_fiz_nina", s: "stf_fiz_karolina", svc: ["svc_fiz_pilates"], room: "rm_fiz_3", date: "2026-09-24", time: "12:00", status: "confirmed", pay: "unpaid", src: "site" }),
  appt({ id: "a_fiz_0925_01", t: "t_fizjo", c: "cl_fiz_michal", s: "stf_fiz_piotr", svc: ["svc_fiz_osteo"], room: "rm_fiz_2", date: "2026-09-25", time: "14:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_0928_01", t: "t_fizjo", c: "cl_fiz_dorota", s: "stf_fiz_tomasz", svc: ["svc_fiz_online"], date: "2026-09-28", time: "08:00", status: "confirmed", pay: "paid", src: "app" }),
  appt({ id: "a_fiz_0929_01", t: "t_fizjo", c: "cl_fiz_rafal", s: "stf_fiz_ewa", svc: ["svc_fiz_sport"], room: "rm_fiz_2", date: "2026-09-29", time: "10:00", status: "confirmed", pay: "unpaid", src: "phone" }),
  appt({ id: "a_fiz_1001_01", t: "t_fizjo", c: "cl_fiz_iwona", s: "stf_fiz_karolina", svc: ["svc_fiz_rehab"], room: "rm_fiz_3", date: "2026-10-01", time: "09:00", status: "confirmed", pay: "unpaid", src: "app" }),
  appt({ id: "a_fiz_1002_01", t: "t_fizjo", c: "cl_fiz_marek", s: "stf_fiz_tomasz", svc: ["svc_fiz_manual"], room: "rm_fiz_1", date: "2026-10-02", time: "11:00", status: "pending", pay: "unpaid", src: "site" }),

  appt({ id: "a_gar_0923_01", t: "t_garaz", c: "cl_gar_sylwia", s: "stf_gar_marek", svc: ["svc_gar_service"], room: "rm_gar_1", date: "2026-09-23", time: "09:00", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_CEED }),
  appt({ id: "a_gar_0924_01", t: "t_garaz", c: "cl_gar_julia", s: "stf_gar_darek", svc: ["svc_gar_tyres"], room: "rm_gar_2", date: "2026-09-24", time: "10:00", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_YARIS }),
  appt({ id: "a_gar_0925_01", t: "t_garaz", c: "cl_gar_beata", s: "stf_gar_bartek", svc: ["svc_gar_storage"], date: "2026-09-25", time: "11:00", status: "confirmed", pay: "unpaid", src: "phone", fields: CAR_GOLF }),
  appt({ id: "a_gar_0928_01", t: "t_garaz", c: "cl_gar_krzysztof", s: "stf_gar_marek", svc: ["svc_gar_oil"], room: "rm_gar_1", date: "2026-09-28", time: "08:00", status: "confirmed", pay: "unpaid", src: "app", fields: CAR_PASSAT }),
  appt({ id: "a_gar_0930_01", t: "t_garaz", c: "cl_gar_damian", s: "stf_gar_darek", svc: ["svc_gar_ac"], room: "rm_gar_2", date: "2026-09-30", time: "09:00", status: "pending", pay: "unpaid", src: "google", fields: CAR_OCTAVIA }),
  appt({ id: "a_gar_1001_01", t: "t_garaz", c: "cl_gar_monika", s: "stf_gar_marek", svc: ["svc_gar_diag"], room: "rm_gar_1", date: "2026-10-01", time: "13:00", status: "confirmed", pay: "unpaid", src: "site", fields: CAR_CORSA }),
];

export const SEED_APPOINTMENTS: Appointment[] = [
  ...PAST,
  ...AURORA_TODAY,
  ...FIZJO_TODAY,
  ...GARAZ_TODAY,
  ...AURORA_TOMORROW,
  ...FIZJO_TOMORROW,
  ...GARAZ_TOMORROW,
  ...FUTURE,
].sort((a, b) => a.start.localeCompare(b.start));

/* ------------------------------------------------------------------ */
/* Calendar blocks                                                     */
/* ------------------------------------------------------------------ */

function block(
  id: string,
  tenantId: string,
  staffId: string,
  date: string,
  from: string,
  to: string,
  kind: BlockKind,
  label: LocalizedText,
): CalendarBlock {
  return {
    id,
    tenantId,
    staffId,
    start: `${date}T${from}:00`,
    end: `${date}T${to}:00`,
    kind,
    label,
  };
}

const LUNCH = L("Przerwa na lunch", "Lunch break", "Обідня перерва");
const SHORT_BREAK = L("Przerwa", "Break", "Перерва");

export const SEED_BLOCKS: CalendarBlock[] = [
  block("blk_aur_01", "t_aurora", "stf_aur_ola", "2026-09-21", "13:45", "14:30", "break", LUNCH),
  block("blk_aur_02", "t_aurora", "stf_aur_kasia", "2026-09-21", "11:00", "11:30", "break", SHORT_BREAK),
  block("blk_aur_03", "t_aurora", "stf_aur_michal", "2026-09-21", "12:30", "13:00", "break", LUNCH),
  block("blk_aur_04", "t_aurora", "stf_aur_anna", "2026-09-21", "11:00", "13:00", "training", L("Szkolenie — nowa linia koloryzacji", "Training — new colour line", "Навчання — нова лінія фарб")),
  block("blk_aur_05", "t_aurora", "stf_aur_ola", "2026-09-22", "12:15", "13:00", "break", LUNCH),
  block("blk_aur_06", "t_aurora", "stf_aur_kasia", "2026-09-22", "12:00", "12:30", "break", SHORT_BREAK),
  block("blk_aur_07", "t_aurora", "stf_aur_michal", "2026-09-22", "12:30", "13:00", "break", LUNCH),
  block("blk_aur_08", "t_aurora", "stf_aur_kasia", "2026-09-26", "08:00", "20:00", "absence", L("Urlop", "Time off", "Відпустка")),

  block("blk_fiz_01", "t_fizjo", "stf_fiz_tomasz", "2026-09-21", "12:00", "13:00", "break", LUNCH),
  block("blk_fiz_02", "t_fizjo", "stf_fiz_ewa", "2026-09-21", "12:00", "12:30", "break", SHORT_BREAK),
  block("blk_fiz_03", "t_fizjo", "stf_fiz_piotr", "2026-09-21", "08:00", "13:00", "training", L("Kurs osteopatii strukturalnej", "Structural osteopathy course", "Курс структурної остеопатії")),
  block("blk_fiz_04", "t_fizjo", "stf_fiz_karolina", "2026-09-21", "11:30", "12:00", "break", SHORT_BREAK),
  block("blk_fiz_05", "t_fizjo", "stf_fiz_tomasz", "2026-09-22", "12:00", "13:00", "break", LUNCH),
  block("blk_fiz_06", "t_fizjo", "stf_fiz_karolina", "2026-09-22", "14:00", "20:00", "absence", L("Wolne popołudnie", "Afternoon off", "Вільний день після обіду")),

  block("blk_gar_01", "t_garaz", "stf_gar_marek", "2026-09-21", "13:30", "14:30", "break", LUNCH),
  block("blk_gar_02", "t_garaz", "stf_gar_darek", "2026-09-21", "12:00", "12:30", "break", SHORT_BREAK),
  block("blk_gar_03", "t_garaz", "stf_gar_bartek", "2026-09-21", "13:00", "18:00", "absence", L("Odbiór dostawy opon", "Collecting a tyre delivery", "Отримання постачання шин")),
  block("blk_gar_04", "t_garaz", "stf_gar_marek", "2026-09-22", "12:00", "13:00", "break", LUNCH),
  block("blk_gar_05", "t_garaz", "stf_gar_darek", "2026-09-29", "08:00", "18:00", "holiday", L("Dzień wolny", "Day off", "Вихідний")),
];

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export const SEED_REVIEWS: Review[] = [
  {
    id: "rev_aur_01",
    tenantId: "t_aurora",
    clientName: "Alicja G.",
    staffId: "stf_aur_kasia",
    rating: 5,
    date: "2026-09-19",
    text: L(
      "Kasia wyczarowała balayage dokładnie taki, jaki pokazałam na zdjęciu. Cztery godziny minęły jak chwila.",
      "Kasia nailed the balayage exactly like the photo I showed her. Four hours flew by.",
      "Кася зробила балаяж точно як на фото, яке я показала. Чотири години пролетіли миттєво.",
    ),
    reply: L(
      "Dziękujemy, Alicjo! Do zobaczenia za dziesięć tygodni.",
      "Thank you, Alicja! See you in ten weeks.",
      "Дякуємо, Аліціє! До зустрічі за десять тижнів.",
    ),
  },
  {
    id: "rev_aur_02",
    tenantId: "t_aurora",
    clientName: "Piotr Z.",
    staffId: "stf_aur_michal",
    rating: 5,
    date: "2026-09-17",
    text: L(
      "Michał zawsze wie, o co mi chodzi, nawet kiedy sam nie wiem. Zero czekania.",
      "Michał always knows what I mean, even when I don't. No waiting at all.",
      "Міхал завжди розуміє, чого я хочу, навіть коли я сам не знаю. Жодного очікування.",
    ),
  },
  {
    id: "rev_aur_03",
    tenantId: "t_aurora",
    clientName: "Marta S.",
    staffId: "stf_aur_ola",
    rating: 5,
    date: "2026-09-15",
    text: L(
      "Rezerwacja przez aplikację zajęła mi minutę, a przypomnienie SMS-em uratowało mi tydzień.",
      "Booking in the app took a minute, and the SMS reminder saved my week.",
      "Бронювання в застосунку зайняло хвилину, а SMS-нагадування врятувало мій тиждень.",
    ),
  },
  {
    id: "rev_aur_04",
    tenantId: "t_aurora",
    clientName: "Olga P.",
    staffId: "stf_aur_anna",
    rating: 5,
    date: "2026-09-11",
    text: L(
      "Keratyna u Anny to najlepsza inwestycja tego roku. Włosy układają się same.",
      "Anna's keratin treatment is the best investment this year. My hair falls into place on its own.",
      "Кератин у Анни — найкраща інвестиція цього року. Волосся вкладається саме.",
    ),
    reply: L(
      "Do zobaczenia przy odświeżeniu za trzy miesiące!",
      "See you for a refresh in three months!",
      "До зустрічі на оновленні за три місяці!",
    ),
  },
  {
    id: "rev_aur_05",
    tenantId: "t_aurora",
    clientName: "Lena A.",
    rating: 4,
    date: "2026-09-08",
    text: L(
      "Świetny efekt, ale wizyta zaczęła się kwadrans po czasie.",
      "Great result, though the visit started fifteen minutes late.",
      "Чудовий результат, але візит почався на чверть години пізніше.",
    ),
    reply: L(
      "Przepraszamy za opóźnienie — poprawiliśmy bufory między wizytami.",
      "Sorry for the delay — we have widened the buffers between visits.",
      "Вибачте за затримку — ми збільшили паузи між візитами.",
    ),
  },
  {
    id: "rev_aur_06",
    tenantId: "t_aurora",
    clientName: "Zofia R.",
    staffId: "stf_aur_kasia",
    rating: 5,
    date: "2026-09-04",
    text: L(
      "Chodzę tu od czterech lat i nigdy nie wyszłam niezadowolona.",
      "I have been coming here for four years and never left unhappy.",
      "Ходжу сюди чотири роки і жодного разу не пішла незадоволеною.",
    ),
  },

  {
    id: "rev_fiz_01",
    tenantId: "t_fizjo",
    clientName: "Marek S.",
    staffId: "stf_fiz_tomasz",
    rating: 5,
    date: "2026-09-18",
    text: L(
      "Po trzech wizytach wróciłem do biegania. Tomasz tłumaczy wszystko po ludzku.",
      "After three visits I was running again. Tomasz explains everything in plain language.",
      "Після трьох візитів я повернувся до бігу. Томаш усе пояснює людською мовою.",
    ),
    reply: L(
      "Trzymamy kciuki za półmaraton!",
      "Fingers crossed for the half marathon!",
      "Тримаємо кулаки за напівмарафон!",
    ),
  },
  {
    id: "rev_fiz_02",
    tenantId: "t_fizjo",
    clientName: "Anna D.",
    staffId: "stf_fiz_ewa",
    rating: 5,
    date: "2026-09-16",
    text: L(
      "Masaż u Ewy to jedyne 60 minut w tygodniu, kiedy naprawdę odpoczywam.",
      "Ewa's massage is the only 60 minutes a week when I really rest.",
      "Масаж у Еви — єдині 60 хвилин на тиждень, коли я справді відпочиваю.",
    ),
  },
  {
    id: "rev_fiz_03",
    tenantId: "t_fizjo",
    clientName: "Jakub W.",
    staffId: "stf_fiz_karolina",
    rating: 5,
    date: "2026-09-12",
    text: L(
      "Rehabilitacja po ACL rozpisana tydzień po tygodniu. Wiem dokładnie, na jakim etapie jestem.",
      "ACL rehab planned week by week. I always know exactly where I am.",
      "Реабілітація після ПКЗ розписана тиждень за тижнем. Я точно знаю, на якому я етапі.",
    ),
  },
  {
    id: "rev_fiz_04",
    tenantId: "t_fizjo",
    clientName: "Elżbieta T.",
    staffId: "stf_fiz_piotr",
    rating: 5,
    date: "2026-09-09",
    text: L(
      "Konsultacja online przed wizytą oszczędziła mi dwa dojazdy.",
      "The online consultation before the visit saved me two trips.",
      "Онлайн-консультація перед візитом зекономила мені дві поїздки.",
    ),
  },
  {
    id: "rev_fiz_05",
    tenantId: "t_fizjo",
    clientName: "Sonia G.",
    rating: 4,
    date: "2026-09-02",
    text: L(
      "Bardzo dobry zespół, choć na popołudniowe terminy trzeba czekać.",
      "A very good team, although afternoon slots take a while to get.",
      "Дуже хороша команда, хоча на післяобідні слоти треба чекати.",
    ),
  },

  {
    id: "rev_gar_01",
    tenantId: "t_garaz",
    clientName: "Andrzej K.",
    staffId: "stf_gar_marek",
    rating: 5,
    date: "2026-09-17",
    text: L(
      "Wycena przed pracą co do złotówki, SMS kiedy auto gotowe. Tak ma być.",
      "A quote to the złoty before any work, an SMS when the car is done. Exactly right.",
      "Оцінка до злотого перед роботою, SMS коли авто готове. Саме так і має бути.",
    ),
    reply: L(
      "Dzięki, panie Andrzeju! Do zobaczenia przy zimówkach.",
      "Thanks! See you for the winter tyres.",
      "Дякуємо! До зустрічі на зимовій гумі.",
    ),
  },
  {
    id: "rev_gar_02",
    tenantId: "t_garaz",
    clientName: "Sylwia B.",
    staffId: "stf_gar_darek",
    rating: 5,
    date: "2026-09-13",
    text: L(
      "Wymiana opon w 40 minut bez kolejki, bo zapisałam się przez stronę.",
      "Tyres changed in 40 minutes with no queue because I booked online.",
      "Заміна шин за 40 хвилин без черги, бо записалась через сайт.",
    ),
  },
  {
    id: "rev_gar_03",
    tenantId: "t_garaz",
    clientName: "Łukasz C.",
    rating: 5,
    date: "2026-09-06",
    text: L(
      "Znaleźli przyczynę stuku, której dwa inne serwisy nie widziały.",
      "They found the source of a knock two other garages had missed.",
      "Знайшли причину стуку, яку два інші сервіси не побачили.",
    ),
  },
  {
    id: "rev_gar_04",
    tenantId: "t_garaz",
    clientName: "Damian Z.",
    staffId: "stf_gar_bartek",
    rating: 4,
    date: "2026-08-29",
    text: L(
      "Solidna robota, choć poczekalnia mogłaby być cieplejsza.",
      "Solid work, though the waiting room could be warmer.",
      "Робота солідна, хоча зала очікування могла б бути теплішою.",
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export const SEED_VOUCHERS: Voucher[] = [
  { id: "vch_aur_01", tenantId: "t_aurora", code: "AURORA200", kind: "gift", value: 200, validUntil: "2026-12-31", buyerName: "Marta Szymańska" },
  { id: "vch_aur_02", tenantId: "t_aurora", code: "PREZENT150", kind: "gift", value: 150, validUntil: "2026-11-30", buyerName: "Piotr Zalewski", usedAt: "2026-09-12" },
  { id: "vch_aur_03", tenantId: "t_aurora", code: "NOWY10", kind: "discount", value: 10, validUntil: "2026-10-31" },
  { id: "vch_fiz_01", tenantId: "t_fizjo", code: "BALANS300", kind: "gift", value: 300, validUntil: "2027-01-31", buyerName: "Adam Ostrowski" },
  { id: "vch_fiz_02", tenantId: "t_fizjo", code: "MASAZ15", kind: "discount", value: 15, validUntil: "2026-10-15" },
  { id: "vch_gar_01", tenantId: "t_garaz", code: "GARAZ100", kind: "gift", value: 100, validUntil: "2026-12-24", buyerName: "Krzysztof Malinowski" },
  { id: "vch_gar_02", tenantId: "t_garaz", code: "OPONY10", kind: "discount", value: 10, validUntil: "2026-11-15" },
];

export const SEED_MEMBERSHIPS: Membership[] = [
  {
    id: "mb_fiz_julia",
    tenantId: "t_fizjo",
    clientId: "cl_fiz_julia",
    name: L("Karnet 5 masaży", "5-massage pass", "Абонемент на 5 масажів"),
    total: 5,
    used: 2,
    validUntil: "2026-12-31",
    price: 800,
  },
  {
    id: "mb_fiz_adam",
    tenantId: "t_fizjo",
    clientId: "cl_fiz_adam",
    name: L("Karnet 10 wizyt — terapia manualna", "10-visit pass — manual therapy", "Абонемент на 10 візитів — мануальна терапія"),
    total: 10,
    used: 6,
    validUntil: "2026-11-30",
    price: 1800,
  },
  {
    id: "mb_fiz_nina",
    tenantId: "t_fizjo",
    clientId: "cl_fiz_nina",
    name: L("Pilates — 8 wejść", "Pilates — 8 classes", "Пілатес — 8 занять"),
    total: 8,
    used: 3,
    validUntil: "2026-12-15",
    price: 440,
  },
  {
    id: "mb_aur_zofia",
    tenantId: "t_aurora",
    clientId: "cl_aur_zofia",
    name: L("Karnet pielęgnacyjny — 4 zabiegi", "Care pass — 4 treatments", "Абонемент догляду — 4 процедури"),
    total: 4,
    used: 1,
    validUntil: "2026-12-31",
    price: 320,
  },
  {
    id: "mb_gar_andrzej",
    tenantId: "t_garaz",
    clientId: "cl_gar_andrzej",
    name: L("Pakiet sezonowy — wymiana i przechowanie", "Season pack — change and storage", "Сезонний пакет — заміна та зберігання"),
    total: 2,
    used: 1,
    validUntil: "2027-04-30",
    price: 250,
  },
];

export const SEED_PRODUCTS: Product[] = [
  { id: "prd_aur_01", tenantId: "t_aurora", name: L("Szampon regenerujący Aurora 250 ml", "Aurora repair shampoo 250 ml", "Відновлювальний шампунь Aurora 250 мл"), sku: "AUR-SH-250", stock: 14, lowStockAt: 5, price: 79 },
  { id: "prd_aur_02", tenantId: "t_aurora", name: L("Odżywka nawilżająca 250 ml", "Moisturising conditioner 250 ml", "Зволожувальний кондиціонер 250 мл"), sku: "AUR-CO-250", stock: 6, lowStockAt: 5, price: 69 },
  { id: "prd_aur_03", tenantId: "t_aurora", name: L("Olejek do włosów 50 ml", "Hair oil 50 ml", "Олійка для волосся 50 мл"), sku: "AUR-OIL-50", stock: 3, lowStockAt: 5, price: 95 },
  { id: "prd_aur_04", tenantId: "t_aurora", name: L("Spray termoochronny 150 ml", "Heat protection spray 150 ml", "Термозахисний спрей 150 мл"), sku: "AUR-TS-150", stock: 11, lowStockAt: 4, price: 59 },
  { id: "prd_fiz_01", tenantId: "t_fizjo", name: L("Taśma kinesiology 5 m", "Kinesiology tape 5 m", "Кінезіо тейп 5 м"), sku: "FIZ-KT-5", stock: 22, lowStockAt: 8, price: 39 },
  { id: "prd_fiz_02", tenantId: "t_fizjo", name: L("Roller do masażu 33 cm", "Massage roller 33 cm", "Ролик для масажу 33 см"), sku: "FIZ-RL-33", stock: 4, lowStockAt: 5, price: 129 },
  { id: "prd_gar_01", tenantId: "t_garaz", name: L("Olej silnikowy 5W30, 5 l", "Engine oil 5W30, 5 l", "Моторна олива 5W30, 5 л"), sku: "GAR-OIL-5", stock: 9, lowStockAt: 4, price: 189 },
  { id: "prd_gar_02", tenantId: "t_garaz", name: L("Płyn do spryskiwaczy zimowy 5 l", "Winter screen wash 5 l", "Зимова рідина для склоомивача 5 л"), sku: "GAR-WS-5", stock: 2, lowStockAt: 6, price: 29 },
];

export const SEED_PAYMENTS: PaymentRecord[] = [
  { id: "pay_aur_01", tenantId: "t_aurora", appointmentId: "a_aur_0921_01", amount: 120, method: "card", at: "2026-09-21T09:02:00", kind: "full" },
  { id: "pay_aur_02", tenantId: "t_aurora", appointmentId: "a_aur_0921_02", amount: 80, method: "blik", at: "2026-09-21T09:58:00", kind: "full" },
  { id: "pay_aur_03", tenantId: "t_aurora", appointmentId: "a_aur_0921_04", amount: 32, method: "apple-pay", at: "2026-09-18T19:41:00", kind: "deposit" },
  { id: "pay_aur_04", tenantId: "t_aurora", appointmentId: "a_aur_0921_08", amount: 250, method: "card", at: "2026-09-21T11:04:00", kind: "full", invoiceNumber: "FV 2026/09/118" },
  { id: "pay_aur_05", tenantId: "t_aurora", appointmentId: "a_aur_0921_10", amount: 84, method: "google-pay", at: "2026-09-17T12:20:00", kind: "deposit" },
  { id: "pay_aur_06", tenantId: "t_aurora", appointmentId: "a_aur_0921_12", amount: 60, method: "cash", at: "2026-09-21T08:31:00", kind: "full" },
  { id: "pay_aur_07", tenantId: "t_aurora", appointmentId: "a_aur_0921_13", amount: 60, method: "blik", at: "2026-09-21T09:01:00", kind: "full" },
  { id: "pay_aur_08", tenantId: "t_aurora", appointmentId: "a_aur_0921_14", amount: 60, method: "card", at: "2026-09-21T09:47:00", kind: "full" },
  { id: "pay_aur_09", tenantId: "t_aurora", appointmentId: "a_aur_0921_15", amount: 60, method: "cash", at: "2026-09-21T10:32:00", kind: "full" },
  { id: "pay_aur_10", tenantId: "t_aurora", appointmentId: "a_aur_0921_16", amount: 50, method: "blik", at: "2026-09-21T11:02:00", kind: "full" },
  { id: "pay_aur_11", tenantId: "t_aurora", appointmentId: "a_aur_0921_20", amount: 380, method: "transfer", at: "2026-09-21T11:06:00", kind: "full", invoiceNumber: "FV 2026/09/119" },
  { id: "pay_aur_12", tenantId: "t_aurora", amount: 95, method: "card", at: "2026-09-21T10:12:00", kind: "product" },
  { id: "pay_aur_13", tenantId: "t_aurora", amount: 200, method: "blik", at: "2026-09-20T16:30:00", kind: "voucher" },
  { id: "pay_aur_14", tenantId: "t_aurora", appointmentId: "a_aur_0916_02", amount: -24, method: "transfer", at: "2026-09-16T10:12:00", kind: "refund" },

  { id: "pay_fiz_01", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_01", amount: 180, method: "card", at: "2026-09-21T08:52:00", kind: "full", invoiceNumber: "FB 2026/09/204" },
  { id: "pay_fiz_02", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_02", amount: 200, method: "blik", at: "2026-09-21T09:53:00", kind: "full" },
  { id: "pay_fiz_03", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_03", amount: 200, method: "cash", at: "2026-09-21T10:54:00", kind: "full" },
  { id: "pay_fiz_04", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_05", amount: 50, method: "blik", at: "2026-09-19T20:14:00", kind: "deposit" },
  { id: "pay_fiz_05", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_06", amount: 120, method: "card", at: "2026-09-20T09:10:00", kind: "full" },
  { id: "pay_fiz_06", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_07", amount: 170, method: "card", at: "2026-09-21T09:33:00", kind: "full" },
  { id: "pay_fiz_07", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_08", amount: 150, method: "blik", at: "2026-09-21T10:32:00", kind: "full" },
  { id: "pay_fiz_08", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_14", amount: 190, method: "transfer", at: "2026-09-21T09:24:00", kind: "full", invoiceNumber: "FB 2026/09/205" },
  { id: "pay_fiz_09", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_15", amount: 190, method: "card", at: "2026-09-21T10:23:00", kind: "full" },
  { id: "pay_fiz_10", tenantId: "t_fizjo", appointmentId: "a_fiz_0921_16", amount: 50, method: "google-pay", at: "2026-09-18T18:02:00", kind: "deposit" },
  { id: "pay_fiz_11", tenantId: "t_fizjo", amount: 300, method: "card", at: "2026-09-15T14:41:00", kind: "voucher" },

  { id: "pay_gar_01", tenantId: "t_garaz", appointmentId: "a_gar_0921_01", amount: 180, method: "card", at: "2026-09-21T09:05:00", kind: "full", invoiceNumber: "G44 2026/09/077" },
  { id: "pay_gar_02", tenantId: "t_garaz", appointmentId: "a_gar_0921_02", amount: 350, method: "transfer", at: "2026-09-21T11:08:00", kind: "full", invoiceNumber: "G44 2026/09/078" },
  { id: "pay_gar_03", tenantId: "t_garaz", appointmentId: "a_gar_0921_05", amount: 160, method: "cash", at: "2026-09-21T09:34:00", kind: "full" },
  { id: "pay_gar_04", tenantId: "t_garaz", appointmentId: "a_gar_0921_06", amount: 120, method: "blik", at: "2026-09-21T10:47:00", kind: "full" },
  { id: "pay_gar_05", tenantId: "t_garaz", appointmentId: "a_gar_0921_09", amount: 50, method: "cash", at: "2026-09-21T12:31:00", kind: "full" },
  { id: "pay_gar_06", tenantId: "t_garaz", amount: 189, method: "card", at: "2026-09-21T09:07:00", kind: "product" },
];

export const SEED_WAITLIST: WaitlistEntry[] = [
  { id: "wl_aur_01", tenantId: "t_aurora", clientId: "cl_aur_iga", serviceId: "svc_aur_color", preferredDate: "2026-09-23", note: "Najlepiej po 16:00.", createdAt: "2026-09-20T18:12:00" },
  { id: "wl_aur_02", tenantId: "t_aurora", clientId: "cl_aur_sara", serviceId: "svc_aur_balayage", preferredDate: "2026-09-26", createdAt: "2026-09-21T08:40:00" },
  { id: "wl_fiz_01", tenantId: "t_fizjo", clientId: "cl_fiz_oskar", serviceId: "svc_fiz_manual", preferredDate: "2026-09-23", note: "Każda godzina rano.", createdAt: "2026-09-19T21:03:00" },
  { id: "wl_fiz_02", tenantId: "t_fizjo", clientId: "cl_fiz_ela", serviceId: "svc_fiz_massage", preferredDate: "2026-09-24", createdAt: "2026-09-20T11:27:00" },
  { id: "wl_gar_01", tenantId: "t_garaz", clientId: "cl_gar_beata", serviceId: "svc_gar_tyres", preferredDate: "2026-09-29", note: "Może być sobota.", createdAt: "2026-09-21T07:55:00" },
];

/* ------------------------------------------------------------------ */
/* Assistant suggestions                                               */
/* ------------------------------------------------------------------ */

export const SEED_SUGGESTIONS: AiSuggestion[] = [
  {
    id: "ai_aur_01",
    tenantId: "t_aurora",
    kind: "fill-gaps",
    title: L(
      "Michał ma 3 h wolnego dziś po 14:00",
      "Michał has 3 free hours after 14:00 today",
      "У Міхала сьогодні 3 вільні години після 14:00",
    ),
    body: L(
      "Wyślij ofertę −15% do 24 klientów, którzy ostatnio strzygli się u niego ponad 5 tygodni temu.",
      "Send a −15% offer to 24 clients whose last cut with him was over 5 weeks ago.",
      "Надішли пропозицію −15% 24 клієнтам, які стриглися в нього понад 5 тижнів тому.",
    ),
    cta: L("Wyślij ofertę", "Send the offer", "Надіслати пропозицію"),
    secondaryCta: L("Nie teraz", "Not now", "Не зараз"),
  },
  {
    id: "ai_aur_02",
    tenantId: "t_aurora",
    kind: "reactivate",
    title: L(
      "18 klientek nie było od ponad 90 dni",
      "18 clients have not visited in over 90 days",
      "18 клієнток не були понад 90 днів",
    ),
    body: L(
      "Zwykle wracały co 8 tygodni. Kampania z kodem −10% odzyskiwała średnio 6 z nich.",
      "They used to come back every 8 weeks. A −10% campaign usually wins about 6 of them back.",
      "Зазвичай вони поверталися кожні 8 тижнів. Кампанія з кодом −10% повертала в середньому 6 із них.",
    ),
    cta: L("Przygotuj kampanię", "Prepare the campaign", "Підготувати кампанію"),
    secondaryCta: L("Odrzuć", "Dismiss", "Відхилити"),
  },
  {
    id: "ai_aur_03",
    tenantId: "t_aurora",
    kind: "pricing",
    title: L(
      "Koloryzacja globalna jest wyceniona poniżej rynku",
      "Full-head colour is priced below the local market",
      "Повне фарбування коштує нижче ринку",
    ),
    body: L(
      "Salony w promieniu 2 km biorą średnio 285 zł. Podwyżka do 270 zł to +1 840 zł miesięcznie.",
      "Salons within 2 km charge 285 zł on average. Moving to 270 zł adds about 1,840 zł a month.",
      "Салони в радіусі 2 км беруть у середньому 285 zł. Підняття до 270 zł — це +1 840 zł на місяць.",
    ),
    cta: L("Zobacz symulację", "See the simulation", "Переглянути симуляцію"),
  },
  {
    id: "ai_aur_04",
    tenantId: "t_aurora",
    kind: "review",
    title: L(
      "11 zadowolonych klientek nie zostawiło opinii",
      "11 happy clients have not left a review",
      "11 задоволених клієнток не залишили відгук",
    ),
    body: L(
      "Poproś o opinię SMS-em dzień po wizycie — to zwykle daje 4 nowe oceny w tygodniu.",
      "Ask by SMS a day after the visit — that usually brings 4 new ratings a week.",
      "Попроси відгук SMS наступного дня після візиту — зазвичай це дає 4 нові оцінки на тиждень.",
    ),
    cta: L("Włącz prośby o opinie", "Turn on review requests", "Увімкнути запити на відгуки"),
    secondaryCta: L("Nie teraz", "Not now", "Не зараз"),
  },

  {
    id: "ai_fiz_01",
    tenantId: "t_fizjo",
    kind: "fill-gaps",
    title: L(
      "Piotr wraca ze szkolenia o 13:00",
      "Piotr is back from training at 13:00",
      "Пьотр повертається з навчання о 13:00",
    ),
    body: L(
      "Zostały 2 wolne okna po 17:15. Na liście oczekujących czekają 2 osoby na terapię manualną.",
      "Two free windows remain after 17:15. Two people on the waitlist want manual therapy.",
      "Залишилось 2 вільні вікна після 17:15. У списку очікування 2 людини на мануальну терапію.",
    ),
    cta: L("Zaproponuj terminy", "Offer the slots", "Запропонувати слоти"),
    secondaryCta: L("Odrzuć", "Dismiss", "Відхилити"),
  },
  {
    id: "ai_fiz_02",
    tenantId: "t_fizjo",
    kind: "reminder",
    title: L(
      "7 pacjentów nie umówiło kolejnej wizyty",
      "7 patients have not booked a follow-up",
      "7 пацієнтів не записалися на наступний візит",
    ),
    body: L(
      "Terapia przerwana w połowie cyklu rzadko kończy się dobrze. Wyślij przypomnienie z linkiem do kalendarza.",
      "Therapy dropped mid-cycle rarely ends well. Send a reminder with a booking link.",
      "Терапія, перервана посеред циклу, рідко закінчується добре. Надішли нагадування з посиланням на запис.",
    ),
    cta: L("Wyślij przypomnienia", "Send reminders", "Надіслати нагадування"),
  },
  {
    id: "ai_fiz_03",
    tenantId: "t_fizjo",
    kind: "pricing",
    title: L(
      "Pakiet 5 wizyt kupuje tylko 12% pacjentów",
      "Only 12% of patients buy the 5-visit package",
      "Лише 12% пацієнтів купують пакет із 5 візитів",
    ),
    body: L(
      "Pokaż pakiet już na ekranie wyboru usługi — u podobnych gabinetów podnosi to sprzedaż do 27%.",
      "Show the package on the service step — similar clinics lift package sales to 27%.",
      "Покажи пакет уже на кроці вибору послуги — у схожих кабінетів це піднімає продажі до 27%.",
    ),
    cta: L("Zmień układ oferty", "Reorder the catalogue", "Змінити порядок послуг"),
    secondaryCta: L("Nie teraz", "Not now", "Не зараз"),
  },
  {
    id: "ai_fiz_04",
    tenantId: "t_fizjo",
    kind: "review",
    title: L(
      "Zajęcia pilates mają 5 z 8 miejsc",
      "The pilates class has 5 of 8 seats taken",
      "На пілатесі зайнято 5 із 8 місць",
    ),
    body: L(
      "Trzy wolne miejsca na dzisiejszą grupę o 17:00 — warto ogłosić je pacjentom z rehabilitacji kręgosłupa.",
      "Three seats free in today's 17:00 group — worth announcing to spine rehab patients.",
      "Три вільні місця на сьогоднішню групу о 17:00 — варто повідомити пацієнтів з реабілітації хребта.",
    ),
    cta: L("Powiadom pacjentów", "Notify patients", "Сповістити пацієнтів"),
  },

  {
    id: "ai_gar_01",
    tenantId: "t_garaz",
    kind: "fill-gaps",
    title: L(
      "Sezon zimówek startuje za 3 tygodnie",
      "Winter tyre season starts in 3 weeks",
      "Сезон зимової гуми стартує за 3 тижні",
    ),
    body: L(
      "61 klientów przechowuje u was opony. Otwórz zapisy teraz, zanim zapełnią się soboty.",
      "61 clients store tyres with you. Open bookings now, before Saturdays fill up.",
      "61 клієнт зберігає у вас шини. Відкрий запис зараз, поки суботи не заповнились.",
    ),
    cta: L("Otwórz zapisy", "Open bookings", "Відкрити запис"),
    secondaryCta: L("Nie teraz", "Not now", "Не зараз"),
  },
  {
    id: "ai_gar_02",
    tenantId: "t_garaz",
    kind: "reminder",
    title: L(
      "9 aut ma przegląd w ciągu 30 dni",
      "9 cars are due for a service within 30 days",
      "9 авто мають ТО протягом 30 днів",
    ),
    body: L(
      "Wyślij SMS z gotowym terminem do zaakceptowania jednym kliknięciem.",
      "Send an SMS with a proposed slot they can accept in one tap.",
      "Надішли SMS із готовим слотом, який можна підтвердити одним дотиком.",
    ),
    cta: L("Wyślij SMS", "Send the SMS", "Надіслати SMS"),
  },
  {
    id: "ai_gar_03",
    tenantId: "t_garaz",
    kind: "pricing",
    title: L(
      "Stanowisko 2 stoi puste 2,5 h dziennie",
      "Bay 2 sits empty 2.5 hours a day",
      "Пост 2 простоює 2,5 години на день",
    ),
    body: L(
      "Wprowadź tańszy termin poranny 08:00–10:00 — w podobnych serwisach wypełnia się w 8 dni.",
      "Add a cheaper 08:00–10:00 morning slot — similar garages fill it within 8 days.",
      "Додай дешевший ранковий слот 08:00–10:00 — у схожих сервісах він заповнюється за 8 днів.",
    ),
    cta: L("Dodaj taryfę poranną", "Add a morning rate", "Додати ранковий тариф"),
    secondaryCta: L("Odrzuć", "Dismiss", "Відхилити"),
  },
];

/* ------------------------------------------------------------------ */
/* Daily metrics (1–21 September)                                      */
/* ------------------------------------------------------------------ */

function dailyMetrics(
  tenantId: string,
  base: { revenue: number; appointments: number; utilization: number },
): DailyMetric[] {
  return range(21, 1).map((day) => {
    const date = `2026-09-${`${day}`.padStart(2, "0")}`;
    const weekday = weekdayOf(date);
    const openFactor = weekday === 7 ? 0 : weekday === 6 ? 0.5 : 1;
    const jitter = 0.82 + hashRatio(`${tenantId}:${date}`) * 0.36;
    const growth = 0.92 + (day / 21) * 0.18;
    return {
      date,
      revenue: Math.round((base.revenue * openFactor * jitter * growth) / 10) * 10,
      appointments: Math.round(base.appointments * openFactor * jitter),
      utilization:
        openFactor === 0
          ? 0
          : clamp(Math.round(base.utilization * jitter * growth), 0, 98),
      newClients:
        openFactor === 0
          ? 0
          : Math.round(hashRatio(`${tenantId}:new:${date}`) * 4),
    };
  });
}

export const SEED_METRICS: Record<string, DailyMetric[]> = {
  t_aurora: dailyMetrics("t_aurora", { revenue: 2380, appointments: 21, utilization: 78 }),
  t_fizjo: dailyMetrics("t_fizjo", { revenue: 2740, appointments: 17, utilization: 74 }),
  t_garaz: dailyMetrics("t_garaz", { revenue: 1620, appointments: 9, utilization: 63 }),
};
