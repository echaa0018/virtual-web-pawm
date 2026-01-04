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
      password: hashedPassword,
    },
  });

  // 3. Upsert Physics Simulations (uses title as unique identifier)
  const pendulumSim = await prisma.simulation.upsert({
    where: { title: 'Simple Pendulum' },
    update: {
      image: '/simple-pendulum.jpg',
    },
    create: {
      title: 'Simple Pendulum',
      description: 'Explore the physics of a simple pendulum and how length, mass, and gravity affect its motion.',
      image: '/simple-pendulum.jpg',
      category: 'Physics',
      config: {
        defaultLength: 200,
        defaultMass: 20,
        defaultGravity: 9.8,
        hasSimulation: true
      }
    }
  });

  const waveSim = await prisma.simulation.upsert({
    where: { title: 'Wave Interference' },
    update: {
      image: '/wave-interference.jpg',
    },
    create: {
      title: 'Wave Interference',
      description: 'Visualize constructive and destructive interference patterns of waves.',
      image: '/wave-interference.jpg',
      category: 'Physics',
      config: {
        hasSimulation: false
      }
    }
  });

  const projectileSim = await prisma.simulation.upsert({
    where: { title: 'Projectile Motion' },
    update: {
      image: '/projectile-motion.webp',
    },
    create: {
      title: 'Projectile Motion',
      description: 'Study the trajectory of objects under the influence of gravity.',
      image: '/projectile-motion.webp',
      category: 'Physics',
      config: {
        hasSimulation: false
      }
    }
  });

  // 4. Upsert Mathematics Simulations
  const graphSim = await prisma.simulation.upsert({
    where: { title: 'Function Grapher' },
    update: {
      image: '/function-grapher.jpeg',
    },
    create: {
      title: 'Function Grapher',
      description: 'Plot and visualize mathematical functions in real-time.',
      image: '/function-grapher.jpeg',
      category: 'Mathematics',
      config: {
        hasSimulation: false
      }
    }
  });

  const fractalSim = await prisma.simulation.upsert({
    where: { title: 'Fractal Explorer' },
    update: {
      image: '/fractal-explorer.jpg',
    },
    create: {
      title: 'Fractal Explorer',
      description: 'Explore the fascinating world of fractals and self-similar patterns.',
      image: '/fractal-explorer.jpg',
      category: 'Mathematics',
      config: {
        hasSimulation: false
      }
    }
  });

  // 5. Upsert Chemistry Simulations
  const moleculeSim = await prisma.simulation.upsert({
    where: { title: 'Molecular Structure' },
    update: {
      image: '/molecular-structure.jpg',
    },
    create: {
      title: 'Molecular Structure',
      description: 'Visualize 3D molecular structures and chemical bonds.',
      image: '/molecular-structure.jpg',
      category: 'Chemistry',
      config: {
        hasSimulation: false
      }
    }
  });

  const phSim = await prisma.simulation.upsert({
    where: { title: 'pH Scale Simulator' },
    update: {
      image: '/ph-scale-simulator.png',
    },
    create: {
      title: 'pH Scale Simulator',
      description: 'Understand acids, bases, and the pH scale through interactive experiments.',
      image: '/ph-scale-simulator.png',
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