import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in frontend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const simulations = [
  {
    title: 'Simple Pendulum',
    description: 'Explore the physics of a simple pendulum. Adjust length, mass, and gravity to see how they affect the period of oscillation.',
    category: 'Physics',
    image: '/simple-pendulum.jpg',
    config: {
      hasSimulation: true,
      component: 'PendulumSimulator'
    }
  },
  {
    title: 'Function Grapher',
    description: 'Visualize mathematical functions in real-time. Enter algebraic expressions to see their 2D plots.',
    category: 'Mathematics',
    image: '/function-grapher.jpeg',
    config: {
      hasSimulation: true,
      component: 'GraphPlotterSimulator'
    }
  },
  {
    title: 'pH Scale Simulator',
    description: 'Test the pH of various common liquids. Visualize the acidity or alkalinity on a dynamic color scale.',
    category: 'Chemistry',
    image: '/ph-scale-simulator.png',
    config: {
      hasSimulation: true,
      component: 'PHMeterSimulator'
    }
  },
  {
    title: 'Projectile Motion',
    description: 'Launch objects and study their parabolic trajectories under gravity with air resistance. Adjust launch angle, initial velocity, and gravity to see how they affect the projectile\'s path.',
    category: 'Physics',
    image: '/projectile-motion.webp',
    config: {
      hasSimulation: true,
      component: 'ProjectileMotionSimulator'
    }
  },
  {
    title: 'Wave Interference',
    description: 'Observe how two waves interact with each other to form constructive and destructive interference patterns.',
    category: 'Physics',
    image: '/wave-interference.jpg',
    config: {
      hasSimulation: false
    }
  },
  {
    title: 'Molecular Structure',
    description: 'Explore 3D models of simple and complex molecules.',
    category: 'Chemistry',
    image: '/molecular-structure.jpg',
    config: {
      hasSimulation: false
    }
  }
];

async function seed() {
  console.log('🌱 Seeding simulations...');

  for (const sim of simulations) {
    // First, check if simulation exists
    const { data: existing } = await supabase
      .from('simulations')
      .select('id')
      .eq('title', sim.title)
      .single();

    if (existing) {
      // Update existing simulation
      const { error } = await supabase
        .from('simulations')
        .update(sim)
        .eq('title', sim.title);

      if (error) {
        console.error(`Error updating ${sim.title}:`, error.message);
      } else {
        console.log(`✅ Updated: ${sim.title}`);
      }
    } else {
      // Insert new simulation
      const { error } = await supabase
        .from('simulations')
        .insert(sim);

      if (error) {
        console.error(`Error inserting ${sim.title}:`, error.message);
      } else {
        console.log(`✅ Inserted: ${sim.title}`);
      }
    }
  }

  console.log('✨ Seeding complete!');
}

seed();