/* Casa Cross — seed data */

const PEOPLE = [
  // Photographers
  { id: "p-01", name: "Eliza Mendez",     role: "photographer", initials: "EM", tint: "var(--slate-tint)",     ink: "var(--slate)",       email: "eliza@elizamendez.co",    phone: "(512) 555-0188", instagram: "@elizamendez.co",    location: "Austin, TX",       bio: "Editorial wedding & lifestyle photographer. Light and shadow obsessive.",       joined: "Jan 2026", events: ["e-01","e-02"] },
  { id: "p-02", name: "Theo Park",        role: "photographer", initials: "TP", tint: "var(--slate-tint)",     ink: "var(--slate)",       email: "theo@theopark.studio",    phone: "(512) 555-0142", instagram: "@theo.park",        location: "Houston, TX",      bio: "Film and digital. Soft tones, intimate moments.",                                joined: "Feb 2026", events: ["e-01","e-04"] },
  { id: "p-03", name: "Sloane Whitaker",  role: "photographer", initials: "SW", tint: "var(--slate-tint)",     ink: "var(--slate)",       email: "hi@sloanewhit.com",       phone: "(214) 555-0107", instagram: "@sloanewhit",       location: "Dallas, TX",       bio: "Editorial focus. Past clients: Magnolia, Brides, Over the Moon.",                joined: "Mar 2026", events: ["e-02","e-03"] },

  // Models
  { id: "p-04", name: "Naomi Aldridge",   role: "model",        initials: "NA", tint: "var(--rose-tint)",      ink: "#a04e60",            email: "naomi@aldridge.co",       phone: "(512) 555-0119", instagram: "@naomi.aldridge",   location: "Austin, TX",       bio: "Bridal & editorial. Reps: Wallflower Mgmt.",                                     joined: "Jan 2026", events: ["e-01","e-03"] },
  { id: "p-05", name: "Joaquin Ferrer",   role: "model",        initials: "JF", tint: "var(--rose-tint)",      ink: "#a04e60",            email: "joaquin@ferrer.io",       phone: "(512) 555-0166", instagram: "@joaquin.ferrer",   location: "San Antonio, TX",  bio: "Groom/menswear. 6'1\" / 40R.",                                                  joined: "Feb 2026", events: ["e-01"] },
  { id: "p-06", name: "Amara Doyle",      role: "model",        initials: "AD", tint: "var(--rose-tint)",      ink: "#a04e60",            email: "a.doyle@ravenmgmt.com",   phone: "(512) 555-0173", instagram: "@amara.doyle",      location: "Austin, TX",       bio: "Bridal & ready-to-wear. Reps: Raven Management.",                                joined: "Feb 2026", events: ["e-02","e-04"] },
  { id: "p-07", name: "Rosa Ibarra",      role: "model",        initials: "RI", tint: "var(--rose-tint)",      ink: "#a04e60",            email: "rosa.ibarra@gmail.com",   phone: "(512) 555-0151", instagram: "@rosaibarra",       location: "Austin, TX",       bio: "First-time model. Editorial & lifestyle.",                                       joined: "Mar 2026", events: ["e-01"] },

  // Vendors
  { id: "p-08", name: "Petal & Stem Co.", role: "vendor",       initials: "PS", tint: "var(--gold-tint)",      ink: "#8a6c2e",            email: "hello@petalandstem.co",   phone: "(512) 555-0123", instagram: "@petalandstem",     location: "Austin, TX",       bio: "Garden-style florals. Specializes in heirloom blooms and trailing greenery.",     joined: "Dec 2025", events: ["e-01","e-02"] },
  { id: "p-09", name: "Linen & Lace Rentals", role: "vendor",   initials: "LL", tint: "var(--gold-tint)",      ink: "#8a6c2e",            email: "rent@linenandlace.com",   phone: "(512) 555-0144", instagram: "@linenandlace",     location: "Austin, TX",       bio: "Tabletop, linens, vintage glassware. Curated rentals.",                          joined: "Jan 2026", events: ["e-01","e-03"] },
  { id: "p-10", name: "Hatchet & Hand",   role: "vendor",       initials: "HH", tint: "var(--gold-tint)",      ink: "#8a6c2e",            email: "shop@hatchetandhand.co",  phone: "(512) 555-0188", instagram: "@hatchet.hand",     location: "Austin, TX",       bio: "Handcrafted wood signage and arbors.",                                           joined: "Feb 2026", events: ["e-01","e-04"] },
  { id: "p-11", name: "The Sweet Page",   role: "vendor",       initials: "SP", tint: "var(--gold-tint)",      ink: "#8a6c2e",            email: "orders@sweetpage.com",    phone: "(512) 555-0177", instagram: "@thesweetpage",     location: "Austin, TX",       bio: "Cakes & desserts. Heirloom tomato cake is a signature.",                          joined: "Feb 2026", events: ["e-01"] },

  // Venues
  { id: "p-12", name: "Magnolia Manor",   role: "venue",        initials: "MM", tint: "var(--sage-tint)",      ink: "var(--sage-deep)",   email: "events@magnoliamanor.com", phone: "(830) 555-0102", instagram: "@magnoliamanor.tx", location: "Fredericksburg, TX", bio: "1890s manor on 12 acres. White columns, oak trees, magnolia gardens.",        joined: "Dec 2025", events: ["e-01"] },
  { id: "p-13", name: "Wildflower Ridge", role: "venue",        initials: "WR", tint: "var(--sage-tint)",      ink: "var(--sage-deep)",   email: "book@wildflowerridge.com", phone: "(512) 555-0119", instagram: "@wildflowerridge", location: "Wimberley, TX",       bio: "Hill country views, native landscaping.",                                       joined: "Feb 2026", events: ["e-02"] },

  // HMUA
  { id: "p-14", name: "Camille Roux",     role: "hmua",         initials: "CR", tint: "#f0e8f0",               ink: "#7a5a8a",            email: "camille@rouxbeauty.co",   phone: "(512) 555-0166", instagram: "@rouxbeauty",       location: "Austin, TX",       bio: "Editorial hair & makeup. Soft-glam specialist.",                                  joined: "Jan 2026", events: ["e-01","e-02"] },
  { id: "p-15", name: "Daphne Liu",       role: "hmua",         initials: "DL", tint: "#f0e8f0",               ink: "#7a5a8a",            email: "daphne@liustudio.com",    phone: "(512) 555-0133", instagram: "@daphneliu.beauty", location: "Austin, TX",       bio: "Bridal hair specialist. Loose updos & natural waves.",                            joined: "Feb 2026", events: ["e-01"] },

  // Stylist
  { id: "p-16", name: "Magnolia + Moss",  role: "stylist",      initials: "MM", tint: "var(--sage-tint)",      ink: "var(--sage-deep)",   email: "studio@magnoliamoss.com", phone: "(512) 555-0188", instagram: "@magnolia.and.moss", location: "Austin, TX",      bio: "Wardrobe styling for editorial bridal. Past: Brides, Magnolia Journal.",         joined: "Jan 2026", events: ["e-01","e-04"] },

  // Sponsor
  { id: "p-17", name: "Heirloom Bridal",  role: "sponsor",      initials: "HB", tint: "#ece8e0",               ink: "#6e5e3a",            email: "press@heirloombridal.co", phone: "(512) 555-0150", instagram: "@heirloombridal",   location: "Austin, TX",       bio: "Independent bridal boutique. Sponsoring 6 gowns for the May shoot.",             joined: "Feb 2026", events: ["e-01"] },
];

const ROLE_META = {
  photographer: { label: "Photographer", plural: "Photographers" },
  model:        { label: "Model",        plural: "Models" },
  vendor:       { label: "Vendor",       plural: "Vendors" },
  venue:        { label: "Venue",        plural: "Venues" },
  hmua:         { label: "Hair & Makeup",plural: "Hair & Makeup" },
  stylist:      { label: "Stylist",      plural: "Stylists" },
  sponsor:      { label: "Sponsor",      plural: "Sponsors" },
};

const ROLE_ORDER = ["venue","photographer","model","hmua","stylist","vendor","sponsor"];

const EVENTS = [
  {
    id: "e-01",
    name: "Magnolia Bridal",
    subtitle: "Styled wedding shoot",
    date: "2026-05-12",
    time: "8:00 AM – 6:00 PM",
    cover: "magnolia",
    venueId: "p-12",
    location: "Magnolia Manor, Fredericksburg",
    status: "confirmed",
    stage: "prep",
    capacity: 18,
    description: "An editorial bridal shoot inspired by 1890s southern romance. Heirloom florals, vintage tabletop, golden-hour portraits in the magnolia grove.",
    tags: ["Editorial", "Bridal", "Hill Country"],
    participants: [
      { personId: "p-12", role: "venue",        rate: 0,    paid: 0,    status: "comp",     contract: "signed" },
      { personId: "p-01", role: "photographer", rate: 450,  paid: 450,  status: "paid",     contract: "signed" },
      { personId: "p-02", role: "photographer", rate: 350,  paid: 350,  status: "paid",     contract: "signed" },
      { personId: "p-04", role: "model",        rate: 250,  paid: 250,  status: "paid",     contract: "signed" },
      { personId: "p-05", role: "model",        rate: 250,  paid: 0,    status: "due",      contract: "signed", dueDate: "2026-05-05" },
      { personId: "p-07", role: "model",        rate: 200,  paid: 100,  status: "partial",  contract: "sent",   dueDate: "2026-05-05" },
      { personId: "p-08", role: "vendor",       rate: 600,  paid: 600,  status: "paid",     contract: "signed" },
      { personId: "p-09", role: "vendor",       rate: 400,  paid: 400,  status: "paid",     contract: "signed" },
      { personId: "p-10", role: "vendor",       rate: 350,  paid: 0,    status: "due",      contract: "sent",   dueDate: "2026-05-08" },
      { personId: "p-11", role: "vendor",       rate: 300,  paid: 300,  status: "paid",     contract: "signed" },
      { personId: "p-14", role: "hmua",         rate: 400,  paid: 400,  status: "paid",     contract: "signed" },
      { personId: "p-15", role: "hmua",         rate: 350,  paid: 0,    status: "due",      contract: "unsent", dueDate: "2026-05-08" },
      { personId: "p-16", role: "stylist",      rate: 500,  paid: 500,  status: "paid",     contract: "signed" },
      { personId: "p-17", role: "sponsor",      rate: 0,    paid: 0,    status: "comp",     contract: "signed" },
    ],
    todos: [
      { id: "t-01", title: "Confirm final shot list with photographers", done: true,  due: "2026-04-28" },
      { id: "t-02", title: "Send call sheet to all participants",         done: true,  due: "2026-05-05" },
      { id: "t-03", title: "Pick up sponsored gowns from Heirloom Bridal", done: false, due: "2026-05-10" },
      { id: "t-04", title: "Confirm hair trial schedule with Daphne",      done: false, due: "2026-05-08" },
      { id: "t-05", title: "Final payment reminders (3 outstanding)",      done: false, due: "2026-05-08" },
      { id: "t-06", title: "Pack styling kit & backup outfits",           done: false, due: "2026-05-11" },
    ],
    moodboard: ["#e8d5d0","#d4a89a","#b8654a","#f4e6e0","#1a1814","#9a948a"],
    activity: [
      { id: "a-01", when: "2 hours ago",  what: "Daphne Liu received contract",       who: "Auto-sent",   tone: "" },
      { id: "a-02", when: "Yesterday",    what: "Joaquin Ferrer's payment is overdue", who: "Reminder sent", tone: "accent" },
      { id: "a-03", when: "2 days ago",   what: "Camille Roux paid in full",          who: "$400.00",     tone: "sage" },
      { id: "a-04", when: "Apr 24",       what: "Eliza Mendez signed contract",       who: "",            tone: "sage" },
      { id: "a-05", when: "Apr 22",       what: "Magnolia Manor confirmed venue",     who: "",            tone: "sage" },
    ],
    chat: [
      { id: "c-01", from: "Eliza Mendez",   when: "9:42 AM", text: "Sunrise call time at 6:30 AM works for me — what time should the models arrive for HMU?", you: false },
      { id: "c-02", from: "You",            when: "9:51 AM", text: "Models at 7, HMU starts at 7:15. Sun's up at 6:50 so we'll have warm-up shots while they prep.", you: true },
      { id: "c-03", from: "Camille Roux",   when: "10:08 AM", text: "Daphne and I will be onsite at 6:45 to set up. Can confirm two stations for the morning rush.", you: false },
      { id: "c-04", from: "Naomi Aldridge", when: "10:22 AM", text: "Bringing my own undergarments + nude heels per the prep doc. Excited 🌿", you: false },
    ],
  },
  {
    id: "e-02",
    name: "Coastal Vows",
    subtitle: "Beach elopement editorial",
    date: "2026-06-04",
    time: "5:30 PM – 9:00 PM",
    cover: "coastal",
    venueId: "p-13",
    location: "Wildflower Ridge, Wimberley",
    status: "planning",
    stage: "booking",
    capacity: 12,
    description: "An intimate elopement-style shoot with hill country sunsets, native blooms, and barefoot moments.",
    tags: ["Elopement", "Sunset"],
    participants: [
      { personId: "p-13", role: "venue",        rate: 0,    paid: 0,    status: "comp",    contract: "signed" },
      { personId: "p-01", role: "photographer", rate: 400,  paid: 200,  status: "partial", contract: "signed", dueDate: "2026-05-25" },
      { personId: "p-03", role: "photographer", rate: 450,  paid: 0,    status: "due",     contract: "sent",   dueDate: "2026-05-25" },
      { personId: "p-06", role: "model",        rate: 250,  paid: 0,    status: "due",     contract: "sent",   dueDate: "2026-05-30" },
      { personId: "p-08", role: "vendor",       rate: 500,  paid: 0,    status: "due",     contract: "unsent", dueDate: "2026-05-28" },
      { personId: "p-14", role: "hmua",         rate: 400,  paid: 0,    status: "due",     contract: "sent",   dueDate: "2026-05-30" },
    ],
    todos: [
      { id: "t-21", title: "Lock final venue walkthrough",      done: true,  due: "2026-04-30" },
      { id: "t-22", title: "Source vintage bicycle prop",       done: false, due: "2026-05-15" },
      { id: "t-23", title: "Book second model (couple shots)",  done: false, due: "2026-05-15" },
      { id: "t-24", title: "Send save-the-dates to participants", done: false, due: "2026-05-10" },
    ],
    moodboard: ["#d8e4e8","#a8b8c4","#5c6b7a","#e0e8d8","#f5f0e6","#1a1814"],
    activity: [
      { id: "a-21", when: "Yesterday", what: "Sloane Whitaker viewed contract", who: "", tone: "" },
      { id: "a-22", when: "3 days ago", what: "Wildflower Ridge confirmed venue", who: "", tone: "sage" },
    ],
    chat: [],
  },
  {
    id: "e-03",
    name: "Garden Party",
    subtitle: "Bridal showcase brunch",
    date: "2026-07-19",
    time: "10:00 AM – 3:00 PM",
    cover: "garden",
    venueId: null,
    location: "TBD — touring 3 venues",
    status: "planning",
    stage: "pitching",
    capacity: 24,
    description: "Garden party-style bridal showcase with three gown looks, brunch tablescape, and floral arches.",
    tags: ["Bridal", "Daytime", "Group"],
    participants: [
      { personId: "p-03", role: "photographer", rate: 500,  paid: 0,    status: "due",      contract: "unsent" },
      { personId: "p-04", role: "model",        rate: 300,  paid: 0,    status: "due",      contract: "unsent" },
      { personId: "p-09", role: "vendor",       rate: 600,  paid: 0,    status: "due",      contract: "unsent" },
    ],
    todos: [
      { id: "t-31", title: "Finalize venue (3 options)",       done: false, due: "2026-05-15" },
      { id: "t-32", title: "Recruit 2 more models",            done: false, due: "2026-05-30" },
      { id: "t-33", title: "Open vendor applications",         done: false, due: "2026-06-01" },
    ],
    moodboard: ["#e0e8d8","#b0c0a0","#6b8068","#f4eed9","#fff5e0","#1a1814"],
    activity: [],
    chat: [],
  },
  {
    id: "e-04",
    name: "Heirloom & Hearth",
    subtitle: "Fall vintage tablescape",
    date: "2026-10-08",
    time: "3:00 PM – 8:00 PM",
    cover: "vintage",
    venueId: null,
    location: "Venue scouting",
    status: "planning",
    stage: "idea",
    capacity: 16,
    description: "Vintage fall tablescape with heirloom textiles, candlelight portraits, autumnal florals.",
    tags: ["Fall", "Tablescape"],
    participants: [
      { personId: "p-02", role: "photographer", rate: 400,  paid: 0, status: "due", contract: "unsent" },
      { personId: "p-06", role: "model",        rate: 300,  paid: 0, status: "due", contract: "unsent" },
      { personId: "p-10", role: "vendor",       rate: 500,  paid: 0, status: "due", contract: "unsent" },
      { personId: "p-16", role: "stylist",      rate: 600,  paid: 0, status: "due", contract: "unsent" },
    ],
    todos: [
      { id: "t-41", title: "Define color story",       done: false, due: "2026-06-01" },
      { id: "t-42", title: "Scout 5 venues",           done: false, due: "2026-07-15" },
    ],
    moodboard: ["#f0e4cc","#d4b890","#8a6c2e","#5a4530","#f5e6d3","#1a1814"],
    activity: [],
    chat: [],
  },
  {
    id: "e-05",
    name: "Tuscany at Home",
    subtitle: "Olive grove engagement",
    date: "2026-04-04",
    time: "5:00 PM – 8:00 PM",
    cover: "tuscany",
    venueId: null,
    location: "Driftwood, TX",
    status: "wrapped",
    stage: "wrapped",
    capacity: 8,
    description: "Engagement-style editorial in a Texas olive grove — Tuscan inspired tablescape and golden-hour portraits.",
    tags: ["Engagement", "Wrapped"],
    participants: [
      { personId: "p-01", role: "photographer", rate: 400, paid: 400, status: "paid", contract: "signed" },
      { personId: "p-04", role: "model",        rate: 200, paid: 200, status: "paid", contract: "signed" },
      { personId: "p-05", role: "model",        rate: 200, paid: 200, status: "paid", contract: "signed" },
      { personId: "p-08", role: "vendor",       rate: 350, paid: 350, status: "paid", contract: "signed" },
    ],
    todos: [
      { id: "t-51", title: "Deliver final gallery", done: true, due: "2026-04-20" },
    ],
    moodboard: ["#f4e2c8","#d8a878","#a4683c","#5a3010","#fff5e6","#1a1814"],
    activity: [
      { id: "a-51", when: "Apr 12", what: "Final gallery delivered to all participants", who: "", tone: "sage" },
    ],
    chat: [],
  },
];

// helpers
function getPerson(id) { return PEOPLE.find(p => p.id === id); }
function getEvent(id) { return EVENTS.find(e => e.id === id); }
function eventsForPerson(personId) {
  return EVENTS.filter(e => e.participants.some(p => p.personId === personId));
}
function fmtMoney(n) {
  if (n === 0) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso, opts = {}) {
  const d = new Date(iso + "T12:00:00");
  const month = d.toLocaleString("en-US", { month: opts.short ? "short" : "long" });
  const day = d.getDate();
  if (opts.weekday) {
    const wd = d.toLocaleString("en-US", { weekday: opts.short ? "short" : "long" });
    return `${wd}, ${month} ${day}`;
  }
  return `${month} ${day}`;
}
function fmtDateFull(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function daysUntil(iso) {
  const d = new Date(iso + "T12:00:00");
  const now = new Date();
  now.setHours(0,0,0,0);
  return Math.round((d - now) / (1000*60*60*24));
}
function daysUntilLabel(iso) {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d > 0 && d < 14) return `In ${d} days`;
  if (d < 0 && d > -14) return `${-d} days ago`;
  return null;
}
// Aggregate totals across all events
function aggregateFinances() {
  let owed = 0, paid = 0, overdue = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  EVENTS.forEach(e => {
    if (e.status === "wrapped") {
      paid += e.participants.reduce((s,p)=> s + p.paid, 0);
      return;
    }
    e.participants.forEach(p => {
      paid += p.paid;
      const remaining = p.rate - p.paid;
      if (remaining > 0) {
        owed += remaining;
        if (p.dueDate && new Date(p.dueDate + "T12:00:00") < today) overdue += remaining;
      }
    });
  });
  return { owed, paid, overdue };
}

Object.assign(window, {
  PEOPLE, EVENTS, ROLE_META, ROLE_ORDER,
  getPerson, getEvent, eventsForPerson,
  fmtMoney, fmtDate, fmtDateFull, daysUntil, daysUntilLabel, aggregateFinances,
});
