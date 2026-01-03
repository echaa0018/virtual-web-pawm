const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // Import bcrypt
const prisma = new PrismaClient();

async function main() {
  // 1. Hash a default password (e.g., "123123")
  const hashedPassword = await bcrypt.hash('123123', 10);

  // 2. Create the User with the hashed password
  const student = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {}, // If user exists, do nothing
    create: {
      email: 'student@university.edu',
      name: 'Jane Doe',
      password: hashedPassword, // <--- This was the missing part!
    },
  });

  // 3. Create the "Filter" Simulation
  const filterSim = await prisma.simulation.create({
    data: {
      title: 'Resistor-Capacitor (RC) Filter',
      description: 'Explore how a capacitor acts as a filter for AC signals.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop',
      category: 'Physics',
      config: {
        defaultResistance: 1000,
        defaultCapacitance: 0.00001,
        voltageInput: 5,
        filterType: 'Low-Pass'
      }
    }
  });

  console.log({ student, filterSim });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());