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

  // 3. Clear existing simulations first
  await prisma.simulation.deleteMany({});

  // 4. Create Physics Simulations
  const pendulumSim = await prisma.simulation.create({
    data: {
      title: 'Simple Pendulum',
      description: 'Explore the physics of a simple pendulum and how length, mass, and gravity affect its motion.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop',
      category: 'Physics',
      config: {
        defaultLength: 200,
        defaultMass: 20,
        defaultGravity: 9.8,
        hasSimulation: true
      }
    }
  });

  const waveSim = await prisma.simulation.create({
    data: {
      title: 'Wave Interference',
      description: 'Visualize constructive and destructive interference patterns of waves.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
      category: 'Physics',
      config: {
        hasSimulation: false
      }
    }
  });

  const projectileSim = await prisma.simulation.create({
    data: {
      title: 'Projectile Motion',
      description: 'Study the trajectory of objects under the influence of gravity.',
      image: 'https://images.unsplash.com/photo-1534224039826-c7a0edd44c1c?w=600&h=400&fit=crop',
      category: 'Physics',
      config: {
        hasSimulation: false
      }
    }
  });

  // 5. Create Mathematics Simulations
  const graphSim = await prisma.simulation.create({
    data: {
      title: 'Function Grapher',
      description: 'Plot and visualize mathematical functions in real-time.',
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop',
      category: 'Mathematics',
      config: {
        hasSimulation: false
      }
    }
  });

  const fractalSim = await prisma.simulation.create({
    data: {
      title: 'Fractal Explorer',
      description: 'Explore the fascinating world of fractals and self-similar patterns.',
      image: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=600&h=400&fit=crop',
      category: 'Mathematics',
      config: {
        hasSimulation: false
      }
    }
  });

  // 6. Create Chemistry Simulations
  const moleculeSim = await prisma.simulation.create({
    data: {
      title: 'Molecular Structure',
      description: 'Visualize 3D molecular structures and chemical bonds.',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&h=400&fit=crop',
      category: 'Chemistry',
      config: {
        hasSimulation: false
      }
    }
  });

  const phSim = await prisma.simulation.create({
    data: {
      title: 'pH Scale Simulator',
      description: 'Understand acids, bases, and the pH scale through interactive experiments.',
      image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&h=400&fit=crop',
      category: 'Chemistry',
      config: {
        hasSimulation: false
      }
    }
  });

  console.log({ student, pendulumSim, waveSim, projectileSim, graphSim, fractalSim, moleculeSim, phSim });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());