/**
 * City Database - lookup and search for Israeli cities
 *
 * Uses the official Pikud HaOref (Home Front Command) city list.
 * Each city has a Hebrew name, English name, zone, and countdown time
 * (seconds to reach shelter after alert).
 *
 * Source: https://github.com/eladnava/pikud-haoref-api/blob/master/cities.json
 */

import { createLogger } from '../utils/logger';

const log = createLogger('cities');

// City entry from the database
export interface CityInfo {
  /** Hebrew name (e.g., "ראש העין") */
  name: string;
  /** English name (e.g., "Rosh HaAyin") */
  name_en: string;
  /** Hebrew zone/area (e.g., "ירקון") */
  zone: string;
  /** English zone/area (e.g., "Yarkon") */
  zone_en: string;
  /** Seconds to reach shelter after alert */
  countdown: number;
}

// Load the city database
let cities: CityInfo[] = [];

try {
  cities = require('../data/cities.json');
  log.info({ count: cities.length }, 'City database loaded');
} catch (err) {
  log.warn('City database not found at src/data/cities.json - search/validation disabled');
}

/**
 * Search for cities matching a query string.
 * Searches both Hebrew and English names.
 * Returns up to `limit` results.
 */
export function searchCities(query: string, limit: number = 10): CityInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: CityInfo[] = [];

  for (const city of cities) {
    if (
      city.name.toLowerCase().includes(q) ||
      city.name_en.toLowerCase().includes(q)
    ) {
      results.push(city);
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Find the exact city info for a given name.
 * Tries exact match first, then substring match.
 */
export function findCity(name: string): CityInfo | null {
  const q = name.trim().toLowerCase();

  // Exact match first
  const exact = cities.find(
    (c) => c.name.toLowerCase() === q || c.name_en.toLowerCase() === q
  );
  if (exact) return exact;

  // Substring match
  const partial = cities.find(
    (c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())
  );
  return partial || null;
}

/**
 * Get the countdown time (seconds to shelter) for a city name.
 * Returns null if city not found.
 */
export function getCountdown(cityName: string): number | null {
  const city = findCity(cityName);
  return city ? city.countdown : null;
}

/**
 * Check if a city name exists in the database.
 */
export function cityExists(name: string): boolean {
  return findCity(name) !== null;
}

/**
 * Get the total number of cities in the database.
 */
export function getCityCount(): number {
  return cities.length;
}
