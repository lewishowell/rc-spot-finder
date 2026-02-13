import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const locations = [
  {
    name: "Desert Dunes Bash Spot",
    description: "Amazing open desert area perfect for high-speed bashing. Wide open spaces with natural jumps and berms.",
    latitude: 33.9425,
    longitude: -116.4194,
    classification: "bash",
    region: "California",
  },
  {
    name: "Thunder Alley RC Track",
    description: "Professional-grade off-road racing track with multiple layouts. Features jumps, rhythm sections, and a well-maintained surface.",
    latitude: 34.0522,
    longitude: -118.2437,
    classification: "race",
    region: "California",
  },
  {
    name: "Rocky Ridge Crawl Trail",
    description: "Technical rock crawling area with varying difficulty levels. Great for testing your crawler's capabilities.",
    latitude: 36.1069,
    longitude: -112.1129,
    classification: "crawl",
    region: "Southwest",
  },
  {
    name: "Sunset Beach Bash Zone",
    description: "Beach-adjacent parking lot and sandy area. Perfect for casual bashing sessions with ocean views.",
    latitude: 33.7175,
    longitude: -118.0532,
    classification: "bash",
    region: "California",
  },
  {
    name: "Midwest RC Speedway",
    description: "Indoor carpet track with 1/10 and 1/8 scale options. Climate controlled for year-round racing.",
    latitude: 41.8781,
    longitude: -87.6298,
    classification: "race",
    region: "Midwest",
  },
  {
    name: "Granite Falls Crawl Park",
    description: "Natural granite formations perfect for scale crawling. Multiple trails rated from beginner to expert.",
    latitude: 34.1478,
    longitude: -117.2946,
    classification: "crawl",
    region: "California",
  },
  {
    name: "Pine Valley Off-Road Park",
    description: "Wooded area with dirt trails and small clearing for bashing. Watch out for roots and stumps!",
    latitude: 42.3601,
    longitude: -71.0589,
    classification: "bash",
    region: "Northeast",
  },
  {
    name: "Gulf Coast Raceway",
    description: "Outdoor clay track with full facilities. Host to regional competitions throughout the season.",
    latitude: 29.7604,
    longitude: -95.3698,
    classification: "race",
    region: "Texas",
  },
];

async function main() {
  console.log("Seeding database...");

  // Create a demo user for seed data
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@rcspotfinder.com" },
    update: {},
    create: {
      email: "demo@rcspotfinder.com",
      name: "RC Spot Finder Community",
    },
  });

  console.log(`Created demo user: ${demoUser.email}`);

  for (const location of locations) {
    await prisma.location.create({
      data: {
        ...location,
        userId: demoUser.id,
      },
    });
  }

  console.log(`Seeded ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
