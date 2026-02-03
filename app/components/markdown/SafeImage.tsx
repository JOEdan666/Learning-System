'use client';

import React, { useEffect, useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

const SafeImage: React.FC<SafeImageProps> = ({ src, alt = '', title, ...props }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt}
        title={title}
        loading="lazy"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in rounded-lg shadow-md max-w-full h-auto mx-auto my-4 border border-gray-100 dark:border-gray-800"
        {...props}
      />
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div className="max-w-[90vw] max-h-[90vh]">
            <img
              src={src}
              alt={alt}
              title={title}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SafeImage;
