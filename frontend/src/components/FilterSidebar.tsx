import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FilterSidebarProps {
  onFiltersChange?: (filters: { categories: string[]; subcategories: string[] }) => void;
}

export function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'SUBJECT': true,
  });

  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({
    'Physics': true,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Physics']);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(['Motion & Mechanics', 'Waves & Sound']);

  useEffect(() => {
    onFiltersChange?.({
      categories: selectedCategories,
      subcategories: selectedSubcategories,
    });
  }, [selectedCategories, selectedSubcategories, onFiltersChange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleItem = (item: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubcategory = (subcategory: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory) 
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const subjects = [
    {
      label: 'Physics',
      checked: selectedCategories.includes('Physics'),
      children: [
        { label: 'Motion & Mechanics', checked: selectedSubcategories.includes('Motion & Mechanics') },
        { label: 'Waves & Sound', checked: selectedSubcategories.includes('Waves & Sound') },
        { label: 'Electricity & Magnetism', checked: selectedSubcategories.includes('Electricity & Magnetism') },
        { label: 'Optics', checked: selectedSubcategories.includes('Optics') },
      ],
    },
    { 
      label: 'Mathematics', 
      checked: selectedCategories.includes('Mathematics'),
      children: [
        { label: 'Algebra', checked: selectedSubcategories.includes('Algebra') },
        { label: 'Trigonometry', checked: selectedSubcategories.includes('Trigonometry') },
        { label: 'Calculus', checked: selectedSubcategories.includes('Calculus') },
      ],
    },
    { 
      label: 'Chemistry', 
      checked: selectedCategories.includes('Chemistry'),
      children: [
        { label: 'Acid-Base', checked: selectedSubcategories.includes('Acid-Base') },
        { label: 'Molecular Structure', checked: selectedSubcategories.includes('Molecular Structure') },
        { label: 'Chemical Reactions', checked: selectedSubcategories.includes('Chemical Reactions') },
      ],
    },
  ];

  return (
    <div className="bg-white">
      {/* SUBJECT Section - Only filter shown */}
      <div className="pb-4">
        <button
          onClick={() => toggleSection('SUBJECT')}
          className="flex items-center justify-between w-full text-gray-800 mb-4"
        >
          <span className="text-sm tracking-wider">SUBJECT (1)</span>
          {expandedSections['SUBJECT'] ? (
            <Minus className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Plus className="w-4 h-4 flex-shrink-0" />
          )}
        </button>

        {expandedSections['SUBJECT'] && (
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.label}>
                <div className="flex items-start gap-2">
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
                  {subject.children && (
                    <button
                      onClick={() => toggleItem(subject.label)}
                      className="p-1 flex-shrink-0"
                    >
                      {expandedItems[subject.label] ? (
                        <Minus className="w-3 h-3 text-gray-500" />
                      ) : (
                        <Plus className="w-3 h-3 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {subject.children && expandedItems[subject.label] && (
                  <div className="ml-6 mt-2 space-y-2">
                    {subject.children.map((child) => (
                      <div key={child.label} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`${subject.label}-${child.label}`}
                          checked={child.checked}
                          onChange={() => toggleSubcategory(child.label)}
                          className="w-4 h-4 mt-0.5 text-teal-600 rounded border-gray-300 cursor-pointer flex-shrink-0"
                        />
                        <label
                          htmlFor={`${subject.label}-${child.label}`}
                          className="flex-1 text-gray-700 text-sm cursor-pointer select-none leading-relaxed"
                        >
                          {child.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}