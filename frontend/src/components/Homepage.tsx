import React, { useState } from 'react';
import { HeroBanner } from './HeroBanner';
import { FilterSidebar } from './FilterSidebar';
import { ResultsGrid } from './ResultsGrid';
import { X } from 'lucide-react';

interface HomepageProps {
  simulations: any[]; // <--- Add this prop
  onSimulationClick: (simulation: any) => void;
}

export function Homepage({ simulations, onSimulationClick }: HomepageProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

  const handleFiltersChange = (filters: { categories: string[]; subcategories: string[] }) => {
    setSelectedCategories(filters.categories);
    setSelectedSubcategories(filters.subcategories);
  };

  return (
    <>
      <HeroBanner />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-8">
        <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <FilterSidebar onFiltersChange={handleFiltersChange} />
            </div>
          </aside>
          
          {/* Results Grid - Now using REAL Data */}
          <div>
            <ResultsGrid 
              simulations={simulations} // <--- Pass the data here
              filterOpen={filterOpen}
              setFilterOpen={setFilterOpen}
              onSimulationClick={onSimulationClick}
              selectedCategories={selectedCategories}
              selectedSubcategories={selectedSubcategories}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer (Same as before) */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setFilterOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg text-gray-900">Filters</h2>
              <button onClick={() => setFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar onFiltersChange={handleFiltersChange} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4">
              <button onClick={() => setFilterOpen(false)} className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}