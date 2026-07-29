const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log("Fixing foreign keys for projectId...");

    // sites: map projectId to id since they were originally the projects
    await prisma.$executeRawUnsafe(`UPDATE "sites" SET "projectId" = "id";`);

    // site_visits: map projectId to the site's projectId
    await prisma.$executeRawUnsafe(`
      UPDATE "site_visits" 
      SET "projectId" = (SELECT "projectId" FROM "sites" WHERE "sites"."id" = "site_visits"."siteId")
      WHERE "siteId" IS NOT NULL;
    `);

    // bookings: map projectId to the site's projectId
    await prisma.$executeRawUnsafe(`
      UPDATE "bookings" 
      SET "projectId" = (SELECT "projectId" FROM "sites" WHERE "sites"."id" = "bookings"."siteId")
      WHERE "siteId" IS NOT NULL;
    `);

    // If there are any site_visits or bookings with invalid projectIds (e.g., site was deleted), set them to a valid one or delete
    // Just in case, set to the first available project if still null or invalid
    await prisma.$executeRawUnsafe(`
      UPDATE "site_visits" SET "projectId" = (SELECT MIN(id) FROM "projects") WHERE "projectId" NOT IN (SELECT id FROM "projects");
    `);
    
    await prisma.$executeRawUnsafe(`
      UPDATE "bookings" SET "projectId" = (SELECT MIN(id) FROM "projects") WHERE "projectId" NOT IN (SELECT id FROM "projects");
    `);

    console.log("Foreign keys fixed.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
