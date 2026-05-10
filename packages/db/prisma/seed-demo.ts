import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MEMBERS_DATA = [
  { firstName: "Sophie", lastName: "MARTIN", profession: "Notaire", company: "Etude Martin & Associés", city: "Paris", bio: "Notaire spécialisée en immobilier de prestige" },
  { firstName: "Alexandre", lastName: "DUBOIS", profession: "Banquier privé", company: "Rothschild & Co", city: "Paris", bio: "Gestion de patrimoine et investissements" },
  { firstName: "Marie", lastName: "LEFEBVRE", profession: "Architecte d'intérieur", company: "ML Design Studio", city: "Lyon", bio: "Rénovation d'hôtels particuliers et appartements haussmanniens" },
  { firstName: "Nicolas", lastName: "MOREAU", profession: "Promoteur immobilier", company: "Moreau Développement", city: "Bordeaux", bio: "Promotion immobilière haut de gamme" },
  { firstName: "Camille", lastName: "BERNARD", profession: "Avocate fiscaliste", company: "Bernard Avocats", city: "Paris", bio: "Optimisation fiscale et structuration patrimoniale" },
  { firstName: "Pierre", lastName: "LAMBERT", profession: "Chef d'entreprise", company: "Lambert Group", city: "Marseille", bio: "Groupe diversifié : immobilier, restauration, hôtellerie" },
  { firstName: "Isabelle", lastName: "GARCIA", profession: "Agent immobilier", company: "Barnes International", city: "Nice", bio: "Immobilier de luxe Côte d'Azur" },
  { firstName: "François", lastName: "ROUX", profession: "Gestionnaire de patrimoine", company: "Primonial", city: "Paris", bio: "Conseil en investissement et gestion de fortune" },
  { firstName: "Charlotte", lastName: "PETIT", profession: "Designer", company: "Studio Petit", city: "Paris", bio: "Design d'espaces commerciaux et résidentiels" },
  { firstName: "Julien", lastName: "ROBERT", profession: "Entrepreneur", company: "Tech Immo Solutions", city: "Toulouse", bio: "PropTech et innovation dans l'immobilier" },
  { firstName: "Aurélie", lastName: "SIMON", profession: "Experte comptable", company: "Cabinet Simon", city: "Strasbourg", bio: "Comptabilité et conseil aux investisseurs immobiliers" },
  { firstName: "Maxime", lastName: "LAURENT", profession: "Directeur de fonds", company: "Eurazeo", city: "Paris", bio: "Private equity et investissement immobilier institutionnel" },
  { firstName: "Nathalie", lastName: "LEROY", profession: "Décoratrice", company: "Maison Leroy", city: "Lille", bio: "Décoration et home staging premium" },
  { firstName: "Antoine", lastName: "MOREL", profession: "Avocat", company: "Morel & Partners", city: "Paris", bio: "Droit immobilier et baux commerciaux" },
  { firstName: "Céline", lastName: "FOURNIER", profession: "Directrice marketing", company: "Kretz & Partners", city: "Paris", bio: "Stratégie marketing dans l'immobilier de luxe" },
  { firstName: "Raphaël", lastName: "GIRARD", profession: "Investisseur", company: "RG Capital", city: "Monaco", bio: "Investisseur immobilier multi-pays" },
  { firstName: "Émilie", lastName: "BONNET", profession: "Courtière en prêts", company: "Meilleurtaux Premium", city: "Lyon", bio: "Financement immobilier haut de gamme" },
  { firstName: "Vincent", lastName: "DUPONT", profession: "Architecte DPLG", company: "Atelier Dupont", city: "Nantes", bio: "Architecture contemporaine et réhabilitation" },
  { firstName: "Laura", lastName: "MASSON", profession: "Consultante", company: "McKinsey", city: "Paris", bio: "Conseil en stratégie pour le secteur immobilier" },
  { firstName: "Thibault", lastName: "LEMAIRE", profession: "Family office", company: "Lemaire Family Office", city: "Genève", bio: "Gestion patrimoniale et allocation d'actifs" },
];

const INVESTMENTS_DATA = [
  {
    title: "Hôtel Particulier - Avenue Foch, Paris 16ème",
    description: "Hôtel particulier d'exception de 850m² avec jardin privatif de 200m². Entièrement rénové par un architecte de renom. 12 pièces, 6 chambres, cave voûtée. Rendement locatif estimé à 3.2% net. Idéal pour une stratégie de division en lots premium ou exploitation en résidence de luxe.",
    location: "Paris 16ème",
    targetAmount: 12500000,
    minimumTicket: 250000,
    status: "open",
    deckUrl: "https://example.com/deck-foch.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
  },
  {
    title: "Immeuble de rapport - Marais, Paris 3ème",
    description: "Immeuble de 6 lots en plein cœur du Marais. 4 appartements + 2 locaux commerciaux. Revenus locatifs actuels : 180k€/an. Potentiel de revalorisation après rénovation estimé à +40%. Copropriété saine, pas de travaux structurels nécessaires.",
    location: "Paris 3ème",
    targetAmount: 8200000,
    minimumTicket: 100000,
    status: "open",
    deckUrl: "https://example.com/deck-marais.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
  },
  {
    title: "Villa contemporaine - Saint-Jean-Cap-Ferrat",
    description: "Villa d'architecte de 450m² avec vue mer panoramique. Piscine à débordement, 5 chambres en suite. Terrain de 2000m². Marché locatif saisonnier très porteur : 50-80k€/semaine en haute saison. Rendement estimé à 5.1% brut.",
    location: "Saint-Jean-Cap-Ferrat",
    targetAmount: 18000000,
    minimumTicket: 500000,
    status: "open",
    deckUrl: "https://example.com/deck-cap-ferrat.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
  },
  {
    title: "Penthouse - Tour First, La Défense",
    description: "Penthouse de 280m² au 47ème étage avec terrasse panoramique de 120m². Vue imprenable sur Paris. Finitions ultra-premium. Rentabilité locative corporate très attractive. Bail 3/6/9 potentiel avec grand groupe.",
    location: "La Défense",
    targetAmount: 5800000,
    minimumTicket: 100000,
    status: "funded",
    deckUrl: "https://example.com/deck-defense.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
  },
  {
    title: "Château viticole - Saint-Émilion",
    description: "Domaine de 15 hectares avec château du XVIIIème siècle entièrement rénové. Production AOC Saint-Émilion Grand Cru. 8 chambres d'hôtes, chai moderne. Double rendement : vin + hôtellerie. Classé monument historique (avantages fiscaux).",
    location: "Saint-Émilion",
    targetAmount: 9500000,
    minimumTicket: 200000,
    status: "funded",
    deckUrl: "https://example.com/deck-stemilion.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800",
  },
  {
    title: "Résidence de tourisme - Megève",
    description: "Chalet de luxe de 600m² convertible en 4 appartements indépendants. Pied des pistes, vue Mont-Blanc. Revenus hivernaux et estivaux. Gestion par Airbnb Luxe. TRI projeté : 8.5% sur 7 ans.",
    location: "Megève",
    targetAmount: 7200000,
    minimumTicket: 150000,
    status: "closed",
    deckUrl: "https://example.com/deck-megeve.pdf",
    coverImageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
  },
];

const EVENTS_DATA = [
  {
    title: "Soirée Networking - Hôtel Plaza Athénée",
    description: "Soirée exclusive réservée aux membres du Kretz Club. Cocktail dînatoire, présentations des nouveaux deals, et networking dans les salons privés du Plaza Athénée. Dress code : tenue de soirée.",
    location: "Hôtel Plaza Athénée",
    address: "25 Avenue Montaigne, 75008 Paris",
    startsAt: new Date("2026-04-15T19:00:00"),
    endsAt: new Date("2026-04-15T23:00:00"),
    price: 150,
    maxAttendees: 80,
    coverImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
  },
  {
    title: "Masterclass Investissement - Les clés du off-market",
    description: "Masterclass animée par les frères Kretz sur les stratégies d'acquisition en off-market. Comment sourcer les meilleures opportunités, négocier en direct propriétaire, et structurer un deal gagnant. Limité à 30 places.",
    location: "Siège Kretz & Partners",
    address: "12 Rue de la Paix, 75002 Paris",
    startsAt: new Date("2026-04-22T14:00:00"),
    endsAt: new Date("2026-04-22T17:00:00"),
    price: 0,
    maxAttendees: 30,
    coverImageUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800",
  },
  {
    title: "Visite privée - Château de Chantilly",
    description: "Visite privée exceptionnelle du Château de Chantilly suivie d'un déjeuner gastronomique dans les cuisines historiques. Découverte des coulisses de la gestion d'un patrimoine historique d'exception. Transport en bus privatisé depuis Paris.",
    location: "Château de Chantilly",
    address: "7 Rue du Connétable, 60500 Chantilly",
    startsAt: new Date("2026-05-10T09:30:00"),
    endsAt: new Date("2026-05-10T16:00:00"),
    price: 250,
    maxAttendees: 40,
    coverImageUrl: "https://images.unsplash.com/photo-1587280501635-068d8e9d76d7?w=800",
  },
  {
    title: "Apéro membres - Rooftop Le Perchoir Marais",
    description: "Afterwork décontracté entre membres sur le rooftop du Perchoir dans le Marais. L'occasion de se retrouver dans une ambiance conviviale, d'échanger sur vos projets et de rencontrer les nouveaux membres du club.",
    location: "Le Perchoir Marais",
    address: "37 Rue de la Verrerie, 75004 Paris",
    startsAt: new Date("2026-04-03T18:30:00"),
    endsAt: new Date("2026-04-03T22:00:00"),
    price: 0,
    maxAttendees: 50,
    coverImageUrl: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
  },
];

const MESSAGES_DATA: Record<string, string[]> = {
  "Discussions": [
    "Bonjour à tous ! Ravi de rejoindre le club. Hâte de découvrir les prochaines opportunités 🙌",
    "Bienvenue ! Tu vas voir, les deals sont vraiment qualitatifs ici",
    "Quelqu'un a des retours sur le deal Avenue Foch ? Le rendement semble très intéressant",
    "Oui j'ai étudié le deck en détail, les projections sont conservatrices ce qui est rassurant. Le quartier est en pleine valorisation",
    "Est-ce que quelqu'un a participé à la dernière soirée au Plaza ? C'était comment ?",
    "Incroyable ! L'ambiance était top et j'ai pu rencontrer plusieurs investisseurs intéressants. On a même eu une présentation exclusive d'un deal off-market",
    "Pour ceux qui hésitent sur le deal Saint-Émilion, j'ai visité le domaine la semaine dernière. C'est magnifique et le potentiel est réel",
    "Merci pour le retour ! C'est le genre d'info qui aide vraiment à prendre une décision",
    "Petite question : est-ce que quelqu'un connaît un bon fiscaliste spécialisé en SCI ?",
    "Camille Bernard dans l'annuaire est excellente, je la recommande les yeux fermés",
  ],
  "Immobilier": [
    "Le marché parisien montre des signes de reprise intéressants au T1 2026. Les prix dans le 16ème ont augmenté de 3.2% sur les 6 derniers mois",
    "Attention quand même, les taux remontent légèrement. Il faut bien calculer son effet de levier",
    "Pour info, nouveau dispositif fiscal en préparation pour les rénovations énergétiques en 2026. Ça pourrait être très intéressant pour nos deals de rénovation",
    "Quelqu'un a de l'expérience avec la location meublée touristique à Nice ? Les réglementations ont beaucoup changé",
    "Oui, la mairie de Nice a durci les règles. Mais avec un bail mobilité c'est encore très rentable. Je peux partager mon retour d'expérience si ça intéresse",
    "Le marché de la Côte d'Azur reste très porteur, surtout sur le segment ultra-premium (>5M€). Les acheteurs internationaux sont de retour en force",
  ],
  "Investissement": [
    "Le deal Cap Ferrat est exceptionnel. Vue mer imprenable, c'est rare à ce prix dans le secteur",
    "J'ai mis 500k sur le deal Plaza. Premiers loyers tombent en mai, je vous ferai un retour",
    "Pour ceux qui cherchent de la diversification, le château viticole à Saint-Émilion offre un profil risque/rendement très différent et complémentaire",
    "Est-ce qu'on peut avoir accès au deck du nouveau deal Megève ? Je ne le trouve pas sur la plateforme",
    "Il sera publié demain normalement. C'est un deal de rénovation avec un TRI projeté très attractif",
  ],
  "Entrepreneuriat": [
    "Pour les entrepreneurs du club : nouveau programme d'accompagnement avec Bpifrance pour les investisseurs immobiliers. Prêts à taux préférentiels",
    "Intéressant ! Tu as le lien vers les conditions ?",
    "Je partage ça dans la semaine. Le ticket minimum est de 200k€ mais les conditions sont vraiment avantageuses",
    "Si certains veulent monter une SAS d'investissement à plusieurs, je connais un excellent avocat en droit des sociétés",
  ],
  "Opportunités": [
    "🔥 Deal flash : Appartement 180m² Rue de Rivoli, vue Tuileries. Prix demandé 2.8M€ mais négociable. Contactez-moi en DM pour le dossier",
    "Vu un immeuble de 12 lots à Bordeaux centre en off-market. Rendement brut de 7.2%. Intéressés ?",
    "Pour info, une belle opportunité en Grèce (Mykonos) va arriver la semaine prochaine. Ticket d'entrée à 100k€",
  ],
  "Présentation": [
    "Bonjour à tous ! Je suis Pierre, chef d'entreprise à Marseille dans l'immobilier et la restauration. Très heureux de rejoindre le club",
    "Bienvenue Pierre ! N'hésite pas si tu as des questions",
    "Hello ! Moi c'est Laura, consultante chez McKinsey spécialisée dans le conseil immobilier. Ravie d'être parmi vous 😊",
    "Bienvenue Laura ! Ton expertise va être très précieuse pour le club",
  ],
};

async function main() {
  console.log("🌱 Starting demo seed...");

  // Get Thomas and Jules
  const thomas = await prisma.member.findFirst({ where: { email: "thomas.jean28@outlook.fr" } });
  const jules = await prisma.member.findFirst({ where: { email: "jules.lamothe@kretzclub.com" } });
  if (!thomas) throw new Error("Thomas not found");

  // Ensure Thomas and Jules are admins
  if (thomas && !thomas.isAdmin) {
    await prisma.member.update({ where: { id: thomas.id }, data: { isAdmin: true } });
    console.log("✅ Promoted Thomas to admin");
  }
  if (jules && !jules.isAdmin) {
    await prisma.member.update({ where: { id: jules.id }, data: { isAdmin: true } });
    console.log("✅ Promoted Jules to admin");
  }

  // Create demo members (without Supabase auth - display only)
  console.log("👥 Creating demo members...");
  const createdMembers = [];
  for (const m of MEMBERS_DATA) {
    const existing = await prisma.member.findFirst({ where: { email: `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@demo.kretzclub.com` } });
    if (existing) {
      createdMembers.push(existing);
      continue;
    }
    const member = await prisma.member.create({
      data: {
        supabaseAuthId: crypto.randomUUID(),
        email: `${m.firstName.toLowerCase()}.${m.lastName.toLowerCase()}@demo.kretzclub.com`,
        firstName: m.firstName,
        lastName: m.lastName,
        profession: m.profession,
        company: m.company,
        city: m.city,
        bio: m.bio,
      },
    });
    createdMembers.push(member);
  }
  console.log(`  ✅ ${createdMembers.length} members created`);

  // Join all members to all channels
  console.log("📢 Joining members to channels...");
  const channels = await prisma.channel.findMany();
  for (const member of createdMembers) {
    for (const channel of channels) {
      await prisma.channelMember.upsert({
        where: { channelId_memberId: { channelId: channel.id, memberId: member.id } },
        create: { channelId: channel.id, memberId: member.id },
        update: {},
      });
    }
  }
  console.log("  ✅ All members joined all channels");

  // Create investments
  console.log("💰 Creating investments...");
  for (const inv of INVESTMENTS_DATA) {
    const existing = await prisma.investment.findFirst({ where: { title: inv.title } });
    if (existing) continue;
    await prisma.investment.create({
      data: {
        title: inv.title,
        description: inv.description,
        location: inv.location,
        targetAmount: inv.targetAmount,
        minimumTicket: inv.minimumTicket,
        status: inv.status,
        deckUrl: inv.deckUrl,
        imageUrl: inv.imageUrl,
        createdById: thomas.id,
      },
    });
  }
  console.log("  ✅ Investments created");

  // Create events
  console.log("📅 Creating events...");
  for (const evt of EVENTS_DATA) {
    const existing = await prisma.event.findFirst({ where: { title: evt.title } });
    if (existing) continue;
    await prisma.event.create({
      data: {
        title: evt.title,
        description: evt.description,
        location: evt.location,
        address: evt.address,
        startsAt: evt.startsAt,
        endsAt: evt.endsAt,
        price: evt.price,
        maxAttendees: evt.maxAttendees,
        coverImageUrl: evt.coverImageUrl,
        createdById: thomas.id,
      },
    });
  }
  console.log("  ✅ Events created");

  // Create messages in channels
  console.log("💬 Creating messages...");
  const allMembers = [thomas, ...(jules ? [jules] : []), ...createdMembers];
  for (const [channelName, messages] of Object.entries(MESSAGES_DATA)) {
    const channel = channels.find(c => c.displayName === channelName);
    if (!channel) continue;

    for (let i = 0; i < messages.length; i++) {
      const author = allMembers[i % allMembers.length];
      if (!author) continue;
      const existing = await prisma.message.findFirst({
        where: { channelId: channel.id, content: messages[i] }
      });
      if (existing) continue;

      const daysAgo = messages.length - i;
      const hoursOffset = Math.floor(Math.random() * 8) + 9; // 9-17h
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hoursOffset, Math.floor(Math.random() * 60), 0, 0);

      await prisma.message.create({
        data: {
          channelId: channel.id,
          authorId: author.id,
          content: messages[i],
          createdAt: date,
        },
      });
    }
  }
  console.log("  ✅ Messages created");

  // Register some members to events
  console.log("🎟️ Registering members to events...");
  const events = await prisma.event.findMany();
  for (const event of events) {
    const attendees = allMembers.slice(0, Math.floor(Math.random() * 10) + 5);
    for (const member of attendees) {
      await prisma.eventRegistration.upsert({
        where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
        create: { eventId: event.id, memberId: member.id, paymentStatus: "paid" },
        update: { paymentStatus: "paid" },
      });
    }
  }
  console.log("  ✅ Event registrations created");

  console.log("\n🎉 Demo seed complete!");
  console.log(`   ${createdMembers.length + 2} members`);
  console.log(`   ${INVESTMENTS_DATA.length} investments`);
  console.log(`   ${EVENTS_DATA.length} events`);
  console.log(`   ${Object.values(MESSAGES_DATA).flat().length} messages`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
