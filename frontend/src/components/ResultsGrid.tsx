import { useState } from 'react';
import { Grid3x3, List, Filter, Search } from 'lucide-react';
import { SimulationCard } from './SimulationCard';

// Define the shape of your Simulation data
interface Simulation {
  id: number;
  title: string;
  description?: string;
  category?: string;
  subcategory?: string; 
  image?: string;
  isNew?: boolean;
  createdAt?: string;
  config?: {
    hasSimulation?: boolean;
    [key: string]: any;
  };
}

interface ResultsGridProps {
  simulations: Simulation[];
  filterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  selectedCategories?: string[];
  selectedSubcategories?: string[];
}

export function ResultsGrid({ 
  simulations,
  filterOpen, 
  setFilterOpen, 
  selectedCategories = [], 
  selectedSubcategories = [] 
}: ResultsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Logic
  const filteredSimulations = simulations.filter(sim => {
    const simCategory = sim.category || 'Physics';
    const simSubcategory = sim.subcategory || 'General';
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(simCategory);
    const subcategoryMatch = selectedSubcategories.length === 0 || selectedSubcategories.includes(simSubcategory);
    const searchMatch = sim.title.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && subcategoryMatch && searchMatch;
  });

  // Sort Logic
  const sortedSimulations = [...filteredSimulations].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    switch (sortBy) {
      case 'newest': return dateB - dateA;
      case 'oldest': return dateA - dateB;
      case 'alphabetical': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });

  return (
    <div>
      {/* --- TOP ROW: Search Bar + Sort + View --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        
        {/* Search Bar (Grows to fill space) */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search simulations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        {/* Controls Group: Sort + View Toggles */}
        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
            
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm bg-white cursor-pointer focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* View Toggles */}
          <div className="hidden sm:flex items-center gap-1 border border-gray-300 rounded-lg p-1 bg-white shadow-sm">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-teal-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-teal-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- BOTTOM ROW: Results Count & Mobile Filter --- */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setFilterOpen(!filterOpen)}
          className="lg:hidden flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white shadow-sm"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="text-sm font-medium">Filters</span>
        </button>
        
        <span className="text-gray-600 text-sm font-medium">
          Found {filteredSimulations.length} result{filteredSimulations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* --- RESULTS GRID --- */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : 'flex flex-col gap-4'}>
        {sortedSimulations.map((simulation) => (
          <SimulationCard 
            key={simulation.id}
            id={simulation.id}
            title={simulation.title}
            image={simulation.image || 'https://placehold.co/600x400?text=Simulation'}
            isNew={simulation.isNew || false}
            hasSimulation={simulation.config?.hasSimulation ?? false}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedSimulations.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p>No simulations found matching "{searchQuery}".</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-teal-600 hover:underline text-sm mt-1"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}