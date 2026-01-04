// supabase/seed.ts
// Run with: npx ts-node supabase/seed.ts
// Or: npx tsx supabase/seed.ts
// Make sure to install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

// Use your Supabase credentials
const SUPABASE_URL = 'https://siwrlxpqpiypzmndjdmw.supabase.co';
// Using service_role key to bypass RLS for seeding
// Get from Supabase Dashboard > Settings > API > service_role key
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpd3JseHBxcGl5cHptbmRqZG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzUyMzc2MywiZXhwIjoyMDgzMDk5NzYzfQ.wWh2G0HoEglsOOrz-CqNlFwFFLESpjz-7Po_7WJmVcg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SimulationData {
  title: string;
  description: string;
  image: string;
  category: string;
  subcategory?: string;
  is_new?: boolean;
  config: Record<string, any>;
}

async function seed() {
  console.log('🌱 Starting seed...');

  // ============================================================================
  // Seed Simulations (no user needed - public data)
  // ============================================================================

  const simulations: SimulationData[] = [
    // Physics Simulations
    {
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
    },
    {
      title: 'Wave Interference',
      description: 'Visualize constructive and destructive interference patterns of waves.',
      image: '/wave-interference.jpg',
      category: 'Physics',
      config: { hasSimulation: false }
    },
    {
      title: 'Projectile Motion',
      description: 'Study the trajectory of objects under the influence of gravity.',
      image: '/projectile-motion.webp',
      category: 'Physics',
      config: { hasSimulation: false }
    },

    // Mathematics Simulations
    {
      title: 'Function Grapher',
      description: 'Plot and visualize mathematical functions in real-time.',
      image: '/function-grapher.jpeg',
      category: 'Mathematics',
      config: { hasSimulation: false }
    },
    {
      title: 'Fractal Explorer',
      description: 'Explore the fascinating world of fractals and self-similar patterns.',
      image: '/fractal-explorer.jpg',
      category: 'Mathematics',
      config: { hasSimulation: false }
    },

    // Chemistry Simulations
    {
      title: 'Molecular Structure',
      description: 'Visualize 3D molecular structures and chemical bonds.',
      image: '/molecular-structure.jpg',
      category: 'Chemistry',
      config: { hasSimulation: false }
    },
    {
      title: 'pH Scale Simulator',
      description: 'Understand acids, bases, and the pH scale through interactive experiments.',
      image: '/ph-scale-simulator.png',
      category: 'Chemistry',
      config: { hasSimulation: false }
    }
  ];

  // Upsert simulations (insert or update if title exists)
  for (const sim of simulations) {
    const { data, error } = await supabase
      .from('simulations')
      .upsert(
        { ...sim },
        { onConflict: 'title' }
      )
      .select();

    if (error) {
      console.error(`❌ Error seeding "${sim.title}":`, error.message);
    } else {
      console.log(`✅ Seeded: ${sim.title}`);
    }
  }

  console.log('\n🎉 Seed completed!');

  // List all simulations
  const { data: allSims } = await supabase
    .from('simulations')
    .select('id, title, category');

  console.log('\n📋 All simulations:');
  console.table(allSims);
}

seed().catch(console.error);
