// Scryfall API types and utilities

export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  rarity: "mythic" | "rare" | "uncommon" | "common"
  prices: {
    eur: string | null
    eur_foil: string | null
    usd: string | null
    usd_foil: string | null
  }
  purchase_uris?: {
    cardmarket?: string
    tcgplayer?: string
    cardhoarder?: string
  }
  image_uris?: {
    small: string
    normal: string
    large: string
    art_crop: string
  }
  card_faces?: Array<{
    image_uris?: {
      small: string
      normal: string
      large: string
      art_crop: string
    }
  }>
  colors?: string[] // Array of color codes: W, U, B, R, G
  color_identity?: string[]
  mana_cost?: string
}

export interface ScryfallSearchResult {
  object: "list"
  total_cards: number
  has_more: boolean
  data: ScryfallCard[]
}

/**
 * Search for a card by exact/fuzzy name
 */
export async function searchCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
    )
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }
    
    const card: ScryfallCard = await response.json()
    return card
  } catch (error) {
    console.error("Error searching Scryfall:", error)
    return null
  }
}

/**
 * Autocomplete search for card names
 */
export async function autocompleteCardName(query: string): Promise<string[]> {
  if (query.length < 2) return []
  
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
    )
    
    if (!response.ok) {
      return []
    }
    
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error("Error autocompleting:", error)
    return []
  }
}

/**
 * Search for cards with autocomplete results (returns full card data)
 */
export async function searchCards(query: string, limit = 6): Promise<ScryfallCard[]> {
  if (query.length < 2) return []
  
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name`
    )
    
    if (!response.ok) {
      return []
    }
    
    const result: ScryfallSearchResult = await response.json()
    return result.data.slice(0, limit)
  } catch (error) {
    console.error("Error searching cards:", error)
    return []
  }
}

/**
 * Extract mana colors from a card
 */
export function extractManaColors(card: ScryfallCard): string[] {
  // Prefer colors, fall back to color_identity
  if (card.colors && card.colors.length > 0) {
    return card.colors
  }
  if (card.color_identity && card.color_identity.length > 0) {
    return card.color_identity
  }
  return []
}

/**
 * Get the card image URL (handles double-faced cards)
 */
export function getCardImageUrl(card: ScryfallCard, size: "small" | "normal" | "large" = "normal"): string | null {
  if (card.image_uris) {
    return card.image_uris[size]
  }
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris[size]
  }
  return null
}

/**
 * Map Scryfall rarity to our rarity type
 */
export function mapRarity(rarity: string): "mythic" | "rare" | "uncommon" | "common" {
  if (rarity === "mythic") return "mythic"
  if (rarity === "rare") return "rare"
  if (rarity === "uncommon") return "uncommon"
  return "common"
}

/**
 * Fetch "sniper deals" - valuable cards ordered by price descending
 * Simulates finding deals by comparing to a mock average price
 */
export async function fetchSniperDeals(limit = 8, keywords?: string[]): Promise<ScryfallCard[]> {
  try {
    // Build query based on keywords if available
    let query = "game:paper eur>3 (rarity:mythic OR rarity:rare)"
    
    if (keywords && keywords.length > 0) {
      // Add keyword filters (type or name contains the keyword)
      const keywordFilters = keywords.slice(0, 3).map(k => `(t:${k} OR o:${k} OR name:${k})`).join(" OR ")
      query += ` (${keywordFilters})`
    }
    
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=eur&dir=desc&unique=cards`
    )
    
    if (!response.ok) {
      // Fallback to general search if personalized fails
      if (keywords && keywords.length > 0) {
        return fetchSniperDeals(limit) // Retry without keywords
      }
      console.error("Scryfall sniper search failed:", response.status)
      return []
    }
    
    const result: ScryfallSearchResult = await response.json()
    return result.data.slice(0, limit)
  } catch (error) {
    console.error("Error fetching sniper deals:", error)
    return []
  }
}

/**
 * Extract keywords from a card name or type
 */
export function extractKeywords(cardName: string): string[] {
  // Common MTG creature types and keywords
  const knownTypes = [
    "dragon", "elf", "goblin", "zombie", "angel", "demon", "wizard", 
    "human", "vampire", "merfolk", "soldier", "knight", "beast",
    "elemental", "spirit", "artifact", "enchantment", "planeswalker",
    "sliver", "dinosaur", "cat", "bird", "snake", "spider", "wolf",
    "hydra", "phoenix", "giant", "troll", "ogre", "orc", "cleric"
  ]
  
  const lowerName = cardName.toLowerCase()
  const found: string[] = []
  
  for (const type of knownTypes) {
    if (lowerName.includes(type)) {
      found.push(type)
    }
  }
  
  return found
}

/**
 * Get detected deck theme from keywords
 */
export function getDeckTheme(keywords: string[]): string | null {
  if (keywords.length === 0) return null
  
  // Count frequency of each keyword
  const counts: Record<string, number> = {}
  for (const kw of keywords) {
    counts[kw] = (counts[kw] || 0) + 1
  }
  
  // Find the most common keyword
  let maxCount = 0
  let theme: string | null = null
  
  for (const [kw, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      theme = kw
    }
  }
  
  // Only return if we have at least 2 occurrences
  if (maxCount >= 2 && theme) {
    return theme.charAt(0).toUpperCase() + theme.slice(1) + "s"
  }
  
  // Or if we have a single keyword that appears
  if (keywords.length >= 1) {
    const first = keywords[0]
    return first.charAt(0).toUpperCase() + first.slice(1) + "s"
  }
  
  return null
}
