import React, { useState, useEffect } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HOME_SIZES } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import { Info, MapPin, DollarSign, Home } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// USA GeoJSON url
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Types for our heatmap data
interface CostDataPoint {
  state: string;
  code: string;
  coordinates: [number, number];
  fullServiceCost: number;
  hybridCost: number;
  diyCost: number;
  popularity: number; // How common it is as a destination
}

interface TooltipData {
  state: string;
  cost: number;
  costType: string;
}

// Default origin for cost calculations
const DEFAULT_ORIGIN = "New York, NY";

export function MovingCostHeatmap() {
  const [selectedHomeSize, setSelectedHomeSize] = useState<string>("2bedroom");
  const [selectedOrigin, setSelectedOrigin] = useState<string>(DEFAULT_ORIGIN);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [costType, setCostType] = useState<string>("hybrid"); // 'diy', 'hybrid', or 'fullService'
  const [position, setPosition] = useState<{ coordinates: [number, number], zoom: number }>({
    coordinates: [-96, 38],
    zoom: 3.5
  });
  
  // Fetch cost data for the entire map
  const { data: costData, isLoading } = useQuery<CostDataPoint[]>({
    queryKey: ['/api/moving-costs-map', selectedHomeSize, selectedOrigin],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/moving-costs-map?origin=${encodeURIComponent(selectedOrigin)}&homeSize=${selectedHomeSize}`);
        return response.json();
      } catch (error) {
        console.error('Error fetching cost data:', error);
        // Return mock data for development until API is fully implemented
        return getMockStateData(selectedHomeSize, selectedOrigin);
      }
    }
  });
  
  // Handle map marker click for origin selection
  const handleMarkerClick = (stateName: string) => {
    setSelectedOrigin(stateName);
    toast({
      title: "Origin Updated",
      description: `Cost estimates now calculated from ${stateName}`,
    });
  };
  
  // Get min and max costs for the color scale
  const getMinMaxCosts = () => {
    if (!costData || costData.length === 0) return { min: 500, max: 5000 };
    
    const costs = costData.map(d => {
      if (costType === 'diy') return d.diyCost;
      if (costType === 'fullService') return d.fullServiceCost;
      return d.hybridCost; // default to hybrid
    });
    
    return {
      min: Math.min(...costs),
      max: Math.max(...costs)
    };
  };
  
  // Create a color scale based on the cost data
  const { min, max } = getMinMaxCosts();
  const colorScale = scaleLinear<string>()
    .domain([min, min + (max - min) / 2, max])
    .range(["#c7e8ff", "#4dabf7", "#1864ab"]);
  
  // Get cost by state code
  const getCostByState = (stateCode: string): number => {
    if (!costData) return 0;
    const state = costData.find(d => d.code === stateCode);
    if (!state) return 0;
    
    if (costType === 'diy') return state.diyCost;
    if (costType === 'fullService') return state.fullServiceCost;
    return state.hybridCost; // default to hybrid
  };
  
  // Get state name by state code
  const getStateNameByCode = (stateCode: string): string => {
    if (!costData) return "";
    const state = costData.find(d => d.code === stateCode);
    return state?.state || stateCode;
  };
  
  // Handle mouse over for tooltip
  const handleMouseEnter = (geo: any) => {
    const { NAME, STUSPS } = geo.properties;
    const cost = getCostByState(STUSPS);
    
    setTooltipData({
      state: NAME,
      cost,
      costType
    });
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setTooltipData(null);
  };
  
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Moving Cost Heatmap</CardTitle>
            <CardDescription>
              Visualize moving costs from {selectedOrigin} across the United States
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedHomeSize} onValueChange={setSelectedHomeSize}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Home Size" />
              </SelectTrigger>
              <SelectContent>
                {HOME_SIZES.map(size => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={costType} onValueChange={setCostType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Cost Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diy">DIY Moving</SelectItem>
                <SelectItem value="hybrid">Hybrid Moving</SelectItem>
                <SelectItem value="fullService">Full Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="border rounded-md p-4 relative bg-white">
            {isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="relative">
                <ComposableMap
                  projection="geoAlbersUsa"
                  projectionConfig={{ scale: 1000 }}
                  style={{ width: "100%", height: "400px" }}
                >
                  <ZoomableGroup
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={setPosition}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map(geo => {
                          const stateCode = geo.properties.STUSPS;
                          const cost = getCostByState(stateCode);
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={cost ? colorScale(cost) : "#EEE"}
                              stroke="#FFF"
                              strokeWidth={0.5}
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none", fill: "#E42" },
                                pressed: { outline: "none" },
                              }}
                              onMouseEnter={() => handleMouseEnter(geo)}
                              onMouseLeave={handleMouseLeave}
                            />
                          );
                        })
                      }
                    </Geographies>
                    
                    {/* Origin marker */}
                    {costData && costData.find(d => d.state.includes(selectedOrigin.split(',')[0])) && (
                      <Marker
                        coordinates={costData.find(d => d.state.includes(selectedOrigin.split(',')[0]))?.coordinates || [-74, 40.7]}
                      >
                        <g
                          fill="none"
                          stroke="#FF5533"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          transform="translate(-12, -24)"
                        >
                          <circle cx="12" cy="10" r="3" />
                          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                        </g>
                        <text
                          textAnchor="middle"
                          y={-30}
                          style={{
                            fontFamily: "system-ui",
                            fill: "#5D5A6D",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          {selectedOrigin.split(',')[0]}
                        </text>
                      </Marker>
                    )}
                  </ZoomableGroup>
                </ComposableMap>
                
                {/* Tooltip */}
                {tooltipData && (
                  <div className="absolute bg-white shadow-lg rounded-md p-3 border min-w-[150px] z-10" 
                       style={{ 
                         top: "10px", 
                         right: "10px"
                       }}>
                    <div className="font-bold">{tooltipData.state}</div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">
                        {costType === 'diy' ? 'DIY' : costType === 'fullService' ? 'Full Service' : 'Hybrid'} Cost:
                      </span>
                      <span className="ml-1 text-primary font-semibold">
                        ${tooltipData.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Click on a state to set as origin
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Legend */}
            <div className="flex justify-between items-center mt-3 px-4">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: colorScale(min) }}></div>
                <span className="text-xs">${min.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: colorScale(min + (max - min) / 2) }}></div>
                <span className="text-xs">${Math.round(min + (max - min) / 2).toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-sm mr-1" style={{ backgroundColor: colorScale(max) }}></div>
                <span className="text-xs">${max.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Moving from {selectedOrigin}</CardTitle>
                <CardDescription>
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-1" />
                    <span>{HOME_SIZES.find(size => size.value === selectedHomeSize)?.label || '2 Bedroom'} home</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-50">DIY</Badge>
                      <span>Do-it-yourself</span>
                    </div>
                    <div className="font-bold text-primary">
                      ${costData?.find(d => d.state.includes(selectedOrigin.split(',')[0]))?.diyCost.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-100">Hybrid</Badge>
                      <span>Partial service</span>
                    </div>
                    <div className="font-bold text-primary">
                      ${costData?.find(d => d.state.includes(selectedOrigin.split(',')[0]))?.hybridCost.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-blue-200">Full Service</Badge>
                      <span>Professional movers</span>
                    </div>
                    <div className="font-bold text-primary">
                      ${costData?.find(d => d.state.includes(selectedOrigin.split(',')[0]))?.fullServiceCost.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Popular Moving Destinations</CardTitle>
                <CardDescription>
                  Most common destinations from {selectedOrigin.split(',')[0]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {costData ? (
                  <div className="space-y-3">
                    {[...costData]
                      .sort((a, b) => b.popularity - a.popularity)
                      .slice(0, 5)
                      .map((destination, index) => (
                        <div key={destination.code} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                          <div className="flex items-center">
                            <span className="mr-2 text-sm text-gray-500">{index + 1}.</span>
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            <span>{destination.state}</span>
                          </div>
                          <div className="font-semibold text-primary">
                            ${costType === 'diy' 
                              ? destination.diyCost.toLocaleString() 
                              : costType === 'fullService' 
                                ? destination.fullServiceCost.toLocaleString() 
                                : destination.hybridCost.toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No cost data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-2">
            <p className="text-sm text-gray-500 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Cost estimates are based on home size, distance, and regional price differences.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Temporary mock data generator until API is implemented
function getMockStateData(homeSize: string, originState: string): CostDataPoint[] {
  // Mock major cities with coordinates
  const stateData = [
    { state: "New York, NY", code: "NY", coordinates: [-74.0060, 40.7128], baseCost: 2500, popularity: 85 },
    { state: "Los Angeles, CA", code: "CA", coordinates: [-118.2437, 34.0522], baseCost: 2800, popularity: 90 },
    { state: "Chicago, IL", code: "IL", coordinates: [-87.6298, 41.8781], baseCost: 2200, popularity: 75 },
    { state: "Houston, TX", code: "TX", coordinates: [-95.3698, 29.7604], baseCost: 2100, popularity: 80 },
    { state: "Phoenix, AZ", code: "AZ", coordinates: [-112.0740, 33.4484], baseCost: 2000, popularity: 70 },
    { state: "Philadelphia, PA", code: "PA", coordinates: [-75.1652, 39.9526], baseCost: 2300, popularity: 65 },
    { state: "San Antonio, TX", code: "TX2", coordinates: [-98.4936, 29.4241], baseCost: 2050, popularity: 60 },
    { state: "San Diego, CA", code: "CA2", coordinates: [-117.1611, 32.7157], baseCost: 2700, popularity: 75 },
    { state: "Dallas, TX", code: "TX3", coordinates: [-96.7970, 32.7767], baseCost: 2150, popularity: 70 },
    { state: "San Jose, CA", code: "CA3", coordinates: [-121.8863, 37.3382], baseCost: 3000, popularity: 65 },
    { state: "Austin, TX", code: "TX4", coordinates: [-97.7431, 30.2672], baseCost: 2200, popularity: 85 },
    { state: "Jacksonville, FL", code: "FL", coordinates: [-81.6557, 30.3322], baseCost: 2150, popularity: 60 },
    { state: "Columbus, OH", code: "OH", coordinates: [-82.9988, 39.9612], baseCost: 1900, popularity: 55 },
    { state: "Indianapolis, IN", code: "IN", coordinates: [-86.1581, 39.7684], baseCost: 1850, popularity: 50 },
    { state: "Charlotte, NC", code: "NC", coordinates: [-80.8431, 35.2271], baseCost: 2050, popularity: 65 },
    { state: "Seattle, WA", code: "WA", coordinates: [-122.3321, 47.6062], baseCost: 2700, popularity: 75 },
    { state: "Denver, CO", code: "CO", coordinates: [-104.9903, 39.7392], baseCost: 2400, popularity: 75 },
    { state: "Washington, DC", code: "DC", coordinates: [-77.0369, 38.9072], baseCost: 2600, popularity: 70 },
    { state: "Boston, MA", code: "MA", coordinates: [-71.0589, 42.3601], baseCost: 2700, popularity: 65 },
    { state: "Nashville, TN", code: "TN", coordinates: [-86.7816, 36.1627], baseCost: 2050, popularity: 70 },
    { state: "Atlanta, GA", code: "GA", coordinates: [-84.3880, 33.7490], baseCost: 2150, popularity: 80 },
    { state: "Miami, FL", code: "FL2", coordinates: [-80.1918, 25.7617], baseCost: 2300, popularity: 85 },
    { state: "Portland, OR", code: "OR", coordinates: [-122.6765, 45.5231], baseCost: 2350, popularity: 65 },
    { state: "Detroit, MI", code: "MI", coordinates: [-83.0458, 42.3314], baseCost: 1900, popularity: 50 },
    { state: "Minneapolis, MN", code: "MN", coordinates: [-93.2650, 44.9778], baseCost: 2000, popularity: 55 },
    { state: "Las Vegas, NV", code: "NV", coordinates: [-115.1398, 36.1699], baseCost: 2200, popularity: 70 },
    { state: "New Orleans, LA", code: "LA", coordinates: [-90.0715, 29.9511], baseCost: 2100, popularity: 60 },
    { state: "Cincinnati, OH", code: "OH2", coordinates: [-84.5120, 39.1031], baseCost: 1850, popularity: 45 },
    { state: "Kansas City, MO", code: "MO", coordinates: [-94.5786, 39.0997], baseCost: 1900, popularity: 50 },
    { state: "Salt Lake City, UT", code: "UT", coordinates: [-111.8910, 40.7608], baseCost: 2050, popularity: 55 },
  ];
  
  // Find origin city
  const origin = stateData.find(city => city.state.includes(originState.split(',')[0])) || stateData[0];
  
  // Adjust costs based on distance from origin
  return stateData.map(city => {
    // Calculate distance
    const lat1 = origin.coordinates[1];
    const lon1 = origin.coordinates[0];
    const lat2 = city.coordinates[1];
    const lon2 = city.coordinates[0];
    
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    
    // Adjust cost based on distance and home size multiplier
    const homeSizeMultiplier = 
      homeSize === "studio" ? 0.6 : 
      homeSize === "1bedroom" ? 0.8 :
      homeSize === "2bedroom" ? 1.0 :
      homeSize === "3bedroom" ? 1.3 : 1.5;
    
    // Calculate costs
    const baseCost = Math.round(city.baseCost * homeSizeMultiplier);
    const distanceFactor = distance / 1000; // Normalize distance effect
    const hybridCost = Math.round(baseCost * (1 + distanceFactor));
    
    return {
      state: city.state,
      code: city.code,
      coordinates: city.coordinates,
      hybridCost: hybridCost,
      diyCost: Math.round(hybridCost * 0.6), // DIY is cheaper
      fullServiceCost: Math.round(hybridCost * 1.7), // Full service is more expensive
      popularity: city.popularity - (distance / 500) // Popularity decreases with distance
    };
  });
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}