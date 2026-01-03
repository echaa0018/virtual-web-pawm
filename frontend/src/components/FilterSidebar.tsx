import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FilterSidebarProps {
  onFiltersChange?: (filters: { categories: string[]; subcategories: string[] }) => void;
}

export function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'SUBJECT': true,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange?.({
      categories: selectedCategories,
      subcategories: [],
    });
  }, [selectedCategories, onFiltersChange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const subjects = [
    { label: 'Physics', checked: selectedCategories.includes('Physics') },
    { label: 'Mathematics', checked: selectedCategories.includes('Mathematics') },
    { label: 'Chemistry', checked: selectedCategories.includes('Chemistry') },
  ];

  return (
    <div className="bg-white">
      {/* SUBJECT Section - Only filter shown */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection('SUBJECT')}
          className="flex items-center justify-between w-full text-gray-800 mb-4"
        >
          <span className="text-sm tracking-wider">SUBJECT ({selectedCategories.length})</span>
          {expandedSections['SUBJECT'] ? (
            <Minus className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Plus className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        {expandedSections['SUBJECT'] && (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.label} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id={subject.label}
                  checked={subject.checked}
                  onChange={() => toggleCategory(subject.label)}
                  className="w-4 h-4 mt-0.5 text-teal-600 rounded border-gray-300 cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor={subject.label}
                  className="flex-1 text-gray-700 cursor-pointer select-none leading-relaxed"
                >
                  {subject.label}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}