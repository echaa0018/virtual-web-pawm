import { ImageWithFallback } from './figma/ImageWithFallback';

export function HeroBanner() {
  return (
    <div className="relative bg-gradient-to-b from-blue-400 to-blue-600 h-64 sm:h-80 lg:h-96 overflow-hidden">
      {/* Custom banner background */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="/banner.png"
          alt="Virtual Lab Banner"
          className="w-full h-full object-cover object-[center_19%] opacity-60"
        />
      </div>
      
      {/* Decorative elements - coral and divers */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-800/40 to-transparent" />
      
      {/* Title */}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">Virtual Lab</h1>
          <p className="text-white text-lg sm:text-xl opacity-90">Interactive Simulations</p>
        </div>
      </div>
    </div>
  );
}