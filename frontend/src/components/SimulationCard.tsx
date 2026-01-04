import { ImageWithFallback } from './figma/ImageWithFallback';

interface SimulationCardProps {
  title: string;
  image: string;
  isNew: boolean;
  hasSimulation?: boolean;
  viewMode?: 'grid' | 'list';
  onClick: () => void;
}

export function SimulationCard({ title, image, isNew, hasSimulation = true, viewMode = 'grid', onClick }: SimulationCardProps) {
  const isDisabled = !hasSimulation;

  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleClick}
        className={`bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow flex flex-row ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-lg cursor-pointer group'
        }`}
      >
        {/* Thumbnail */}
        <div className="relative w-48 h-36 bg-gray-100 overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isDisabled ? 'grayscale' : 'group-hover:scale-105'
            }`}
          />
          
          {/* NEW Ribbon */}
          {isNew && !isDisabled && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs tracking-wider">
              NEW
            </div>
          )}

          {/* Coming Soon Badge */}
          {isDisabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-center flex-1">
          <h3 className={`mb-3 text-lg ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow ${
        isDisabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-lg cursor-pointer group'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isDisabled ? 'grayscale' : 'group-hover:scale-105'
          }`}
        />
        
        {/* NEW Ribbon */}
        {isNew && !isDisabled && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs tracking-wider">
            NEW
          </div>
        )}

        {/* Coming Soon Badge */}
        {isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`mb-3 ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
    </div>
  );
}
