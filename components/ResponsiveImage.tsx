// Create this new file

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export default function ResponsiveImage({
  src,
  alt,
  className = '',
  sizes = '100vw',
  fallbackSrc = '/images/placeholder-property.jpg',
  priority = false,
}: ResponsiveImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setImgSrc(src);
    setError(false);
    setIsLoading(true);
  }, [src]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500 text-sm">Image unavailable</span>
        </div>
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={`object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
          sizes={sizes}
          priority={priority}
          onLoad={() => setIsLoading(false)} // Changed from onLoadingComplete
          onError={() => {
            if (imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc);
            } else {
              setError(true);
              setIsLoading(false);
            }
          }}
        />
      )}
    </>
  );
}