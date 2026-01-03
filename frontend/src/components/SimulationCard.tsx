import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SimulationCardProps {
  title: string;
  image: string;
  isNew: boolean;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
}

export function SimulationCard({ title, image, isNew, viewMode = 'grid', onClick }: SimulationCardProps) {
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-row"
      >
        {/* Thumbnail */}
        <div className="relative w-48 h-36 bg-gray-100 overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* NEW Ribbon */}
          {isNew && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs tracking-wider">
              NEW
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-center flex-1">
          <h3 className="text-gray-900 mb-3 text-lg">
            {title}
          </h3>

          {/* Badge */}
          <div className="flex items-center gap-2">
            {/* Accessibility badge */}
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="8" r="1" fill="currentColor"/>
                <path d="M12 12v5M9 14h6"/>
              </svg>
              Accessible
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* NEW Ribbon */}
        {isNew && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs tracking-wider">
            NEW
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-gray-900 mb-3">
          {title}
        </h3>

        {/* Badge */}
        <div className="flex items-center gap-2">
          {/* Accessibility badge */}
          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="8" r="1" fill="currentColor"/>
              <path d="M12 12v5M9 14h6"/>
            </svg>
            Accessible
          </span>
        </div>
      </div>
    </div>
  );
}
