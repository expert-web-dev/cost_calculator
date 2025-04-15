import { useState, useEffect } from 'react';

export function useAddressAutocomplete() {
  const [query, setQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    // In a real application, this would call a places API
    // For the demo, we're using mock data
    const mockSuggestions = getMockSuggestions(query);
    setSuggestions(mockSuggestions);
  }, [query]);

  return { suggestions, query, setQuery };
}

// Helper function to generate mock address suggestions
function getMockSuggestions(query: string): string[] {
  const lowercasedQuery = query.toLowerCase();
  
  const allAddresses = [
    "123 Main St, New York, NY 10001",
    "456 Oak Ave, Los Angeles, CA 90001",
    "789 Pine Rd, Chicago, IL 60601",
    "101 Maple Dr, Houston, TX 77001",
    "202 Cedar Ln, Philadelphia, PA 19019",
    "303 Elm St, San Diego, CA 92101",
    "404 Birch Ave, San Francisco, CA 94016",
    "505 Willow Rd, Boston, MA 02101",
    "606 Spruce Dr, Seattle, WA 98101",
    "707 Ash Ln, Miami, FL 33101",
    "1515 Broadway, New York, NY 10036",
    "1600 Pennsylvania Ave, Washington, DC 20500",
    "233 S Wacker Dr, Chicago, IL 60606",
    "350 5th Ave, New York, NY 10118",
    "843 Brickell Ave, Miami, FL 33131"
  ];
  
  return allAddresses
    .filter(address => address.toLowerCase().includes(lowercasedQuery))
    .slice(0, 5);
}
