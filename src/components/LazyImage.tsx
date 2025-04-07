"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  className?: string
  placeholderSrc?: string
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  placeholderSrc = "/placeholder.svg?height=300&width=400",
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc)
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  useEffect(() => {
    // Don't try to load if src is empty or undefined
    if (!src) {
      setImageSrc(placeholderSrc)
      setImageLoaded(true)
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous" // Add crossOrigin to prevent CORS issues
    img.src = src

    img.onload = () => {
      setImageSrc(src)
      setImageLoaded(true)
    }

    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`)
      setImageSrc(placeholderSrc)
      setImageLoaded(true)
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, placeholderSrc])

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Prevent infinite error loops by checking if already using placeholder
    if (!e.currentTarget.src.includes("placeholder")) {
      console.warn(`Error displaying image: ${src}, falling back to placeholder`)
      e.currentTarget.src = placeholderSrc
    }
    if (onError) {
      onError(e)
    }
  }

  return (
    <img
      src={imageSrc || placeholderSrc}
      alt={alt}
      className={`${className} ${!imageLoaded ? "animate-pulse bg-gray-200 dark:bg-gray-700" : ""}`}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  )
}

export default LazyImage

