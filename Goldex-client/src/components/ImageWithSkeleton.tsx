import { useState } from 'react';
import { ImageWithSkeletonProps } from '../types/images/image.type';

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className = '', 
  skeletonClassName = '' 
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer ${skeletonClassName}`} />
      )}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <div className={`${className} bg-gray-200 flex items-center justify-center`}>
          <span className="text-gray-400 text-sm">Şəkil yüklənmədi</span>
        </div>
      )}
    </div>
  );
}

