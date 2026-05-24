import { useState, useEffect } from 'react';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { PP } from '../styles/tokens';

export default function ProgressiveImage({
  src,
  thumbnail,
  alt,
  width,
  height,
  priority = 'normal',
  onLoad,
  style = {},
}) {
  const [imageSrc, setImageSrc] = useState(thumbnail || src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { shouldLoadImage, getImageQuality, lowDataMode } = useOfflineMode();

  useEffect(() => {
    if (!shouldLoadImage(priority)) {
      setIsLoading(false);
      return;
    }

    const img = new Image();
    const quality = getImageQuality();

    const finalSrc = quality < 1 ? `${src}?q=${Math.round(quality * 100)}` : src;

    img.onload = () => {
      setImageSrc(finalSrc);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);
    };

    img.src = finalSrc;
  }, [src, priority, shouldLoadImage, getImageQuality, onLoad]);

  if (error) {
    return (
      <div
        style={{
          width,
          height,
          background: PP.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          ...style,
        }}
      >
        <span style={{ fontSize: 12, color: PP.text.secondary }}>Failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      style={{
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 300ms',
        ...style,
      }}
    />
  );
}
