import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding channels...");

  const channels = [
    // Le Cercle
    {
      name: "evenements-en-image",
      displayName: "Les événements en image",
      category: "le_cercle" as const,
      sortOrder: 1,
    },
    {
      name: "replay",
      displayName: "Replay",
      category: "le_cercle" as const,
      isReadOnly: true,
      sortOrder: 2,
    },
    // Le Grand Salon
    {
      name: "presentation",
      displayName: "Présentation",
      category: "le_grand_salon" as const,
      sortOrder: 1,
    },
    {
      name: "discussions",
      displayName: "Discussions",
      category: "le_grand_salon" as const,
      sortOrder: 2,
    },
    {
      name: "opportunites",
      displayName: "Opportunités",
      category: "le_grand_salon" as const,
      sortOrder: 3,
    },
    {
      name: "suggestions",
      displayName: "Suggestions",
      category: "le_grand_salon" as const,
      sortOrder: 4,
    },
    {
      name: "kretz-duo",
      displayName: "Kretz Duo",
      category: "le_grand_salon" as const,
      sortOrder: 5,
    },
    // Thématiques
    {
      name: "immobilier",
      displayName: "Immobilier",
      category: "thematiques" as const,
      sortOrder: 1,
    },
    {
      name: "investissement",
      displayName: "Investissement",
      category: "thematiques" as const,
      sortOrder: 2,
    },
    {
      name: "entrepreneuriat",
      displayName: "Entrepreneuriat",
      category: "thematiques" as const,
      sortOrder: 3,
    },
    // Aide
    {
      name: "assistance-technique",
      displayName: "Assistance technique",
      category: "aide" as const,
      sortOrder: 1,
    },
  ];

  for (const channel of channels) {
    await prisma.channel.upsert({
      where: { id: channel.name },
      update: channel,
      create: channel,
    });
  }

  console.log(`Seeded ${channels.length} channels.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
