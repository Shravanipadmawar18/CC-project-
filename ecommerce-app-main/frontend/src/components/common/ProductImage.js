/**
 * ===========================================
 * PRODUCT IMAGE COMPONENT
 * ===========================================
 * 
 * Reusable image component with:
 * - Lazy loading
 * - Loading placeholder/skeleton
 * - Error handling with fallback
 * - Responsive sizing
 */

import React, { useState, useRef, useEffect } from 'react';
import './ProductImage.css';

// Fallback image URL
const FALLBACK_IMAGE = 'https://via.placeholder.com/800x800/667eea/ffffff?text=Product+Image';

// Image placeholder shimmer
const ImageSkeleton = ({ aspectRatio = '1/1' }) => (
  <div className="image-skeleton" style={{ aspectRatio }}>
    <div className="skeleton-shimmer"></div>
  </div>
);

const ProductImage = ({
  src,
  alt = 'Product image',
  className = '',
  width,
  height,
  aspectRatio = '1/1',
  lazy = true,
  showSkeleton = true,
  fallbackSrc = FALLBACK_IMAGE,
  onClick,
  style = {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Determine the image source
  const imageSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  // Check if src is a local path that doesn't exist
  const isValidUrl = (url) => {
    if (!url) return false;
    // If it's a relative path (like /uploads/...), it might not exist
    if (url.startsWith('/uploads/') || url.startsWith('/images/')) {
      return false; // Treat local paths as potentially missing
    }
    return true;
  };

  // Use fallback if src is invalid
  const finalSrc = isValidUrl(src) ? src : fallbackSrc;

  return (
    <div
      ref={imgRef}
      className={`product-image-container ${className}`}
      style={{ aspectRatio, ...style }}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {showSkeleton && isLoading && isInView && (
        <ImageSkeleton aspectRatio={aspectRatio} />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : finalSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`product-image ${isLoading ? 'loading' : 'loaded'}`}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}

      {/* Placeholder when not in view (for lazy loading) */}
      {!isInView && (
        <div className="image-placeholder">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 15l-3.5-4.5L14 15l-3.5-4.5L3 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

// Thumbnail component - smaller version for listings
export const ProductThumbnail = ({
  src,
  alt = 'Product thumbnail',
  size = 'md',
  onClick,
  isActive = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'thumbnail-sm',
    md: 'thumbnail-md',
    lg: 'thumbnail-lg'
  };

  return (
    <div
      className={`product-thumbnail ${sizeClasses[size]} ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      <ProductImage
        src={src}
        alt={alt}
        aspectRatio="1/1"
        showSkeleton={true}
      />
    </div>
  );
};

// Gallery component for product detail page
export const ProductGallery = ({
  images = [],
  productName = 'Product'
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : [{ url: FALLBACK_IMAGE, alt: productName }];

  // Extract URLs from images array
  const imageUrls = galleryImages.map(img => {
    if (typeof img === 'string') return img;
    return img.url || img;
  });

  const handleThumbnailClick = (index) => {
    setSelectedIndex(index);
  };

  const handleMainImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="product-gallery">
      {/* Main image */}
      <div className={`gallery-main ${isZoomed ? 'zoomed' : ''}`}>
        <ProductImage
          src={imageUrls[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="gallery-main-image"
          aspectRatio="1/1"
          lazy={false}
          onClick={handleMainImageClick}
        />
        
        {/* Navigation arrows */}
        {imageUrls.length > 1 && (
          <>
            <button className="gallery-nav prev" onClick={handlePrevious}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button className="gallery-nav next" onClick={handleNext}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        {imageUrls.length > 1 && (
          <div className="gallery-counter">
            {selectedIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="gallery-thumbnails">
          {imageUrls.map((url, index) => (
            <ProductThumbnail
              key={index}
              src={url}
              alt={`${productName} - Thumbnail ${index + 1}`}
              isActive={selectedIndex === index}
              onClick={() => handleThumbnailClick(index)}
              size="md"
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Cart item image
export const CartItemImage = ({
  src,
  alt = 'Cart item',
  size = 'md'
}) => {
  const sizeMap = {
    sm: '60px',
    md: '80px',
    lg: '100px'
  };

  return (
    <div className="cart-item-image" style={{ width: sizeMap[size], height: sizeMap[size] }}>
      <ProductImage
        src={src}
        alt={alt}
        aspectRatio="1/1"
        showSkeleton={true}
      />
    </div>
  );
};

export default ProductImage;
