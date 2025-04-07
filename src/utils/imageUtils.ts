import type React from "react"
import { api } from "../config/db"

/**
 * Converts a relative avatar path to a full URL
 * @param avatarPath The avatar path from the API
 * @returns A full URL that can be used in an img src attribute
 */
export const getFullAvatarUrl = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) return "/placeholder.svg"

  // If it's already a full URL, return it
  if (avatarPath.startsWith("http")) {
    return avatarPath
  }

  // If it's a relative path starting with /, join it with the API base URL
  if (avatarPath.startsWith("/")) {
    // Remove trailing slash from API URL if it exists
    const baseUrl = api.url.endsWith("/") ? api.url.slice(0, -1) : api.url
    return `${baseUrl}${avatarPath}`
  }

  // Otherwise, join with / separator
  return `${api.url}/${avatarPath}`
}

/**
 * Generic function to handle image loading errors
 * @param event The error event from the img tag
 * @param fallbackSrc Optional fallback source to use (defaults to placeholder)
 */
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc = "/placeholder.svg",
) => {
  const target = event.target as HTMLImageElement
  console.error("Error loading image:", target.src)
  target.src = fallbackSrc
}

