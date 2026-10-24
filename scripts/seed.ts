// Resets the database and fills it with the demo data (see lib/seed.ts).
//
//   npm run db:seed

import { seedDatabase } from "../lib/seed";

seedDatabase()
  .then((s) => console.log(`Seeded ${s.brokers} brokers, ${s.deals} deals, ${s.steps} checklist steps.`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
