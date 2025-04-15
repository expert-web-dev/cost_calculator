import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  moveCalculationRequestSchema, 
  type MoveCalculationResponse,
  insertMoveEstimateSchema,
  insertMoveChecklistSchema,
  insertChecklistItemSchema,
  insertUserProgressSchema,
  type UserProgress
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ADDITIONAL_ITEM_COSTS, BASE_COSTS, COST_PER_MILE, SAMPLE_COMPANIES } from "../client/src/lib/constants";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // API endpoint to calculate moving costs
  app.post('/api/calculate-moving-costs', async (req: Request, res: Response) => {
    try {
      // Validate request data
      const data = moveCalculationRequestSchema.parse(req.body);
      
      // Calculate moving costs
      const calculationResult = await calculateMovingCosts(data);
      
      // Save the estimate to storage
      const estimate = await storage.createMoveEstimate({
        origin: data.origin,
        destination: data.destination,
        distance: calculationResult.distance,
        homeSize: data.homeSize,
        additionalItems: data.additionalItems,
        moveDate: data.moveDate,
        flexibility: data.flexibility,
        services: data.services,
        costDiy: calculationResult.costs.diy,
        costHybrid: calculationResult.costs.hybrid,
        costFullService: calculationResult.costs.fullService,
      });
      
      res.json(calculationResult);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: 'Validation error',
          errors: validationError.details
        });
      } else {
        console.error('Error calculating moving costs:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  // API endpoint to retrieve all moving estimates
  app.get('/api/moving-estimates', async (req: Request, res: Response) => {
    try {
      const estimates = await storage.getAllMoveEstimates();
      res.json(estimates);
    } catch (error) {
      console.error('Error retrieving moving estimates:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API endpoint to retrieve user's moving estimates
  app.get('/api/my-estimates', async (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      const estimates = await storage.getUserEstimates(userId);
      res.json(estimates);
    } catch (error) {
      console.error('Error retrieving user estimates:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API endpoint to save a move estimate for logged in user
  app.post('/api/save-estimate', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = insertMoveEstimateSchema.omit({ createdAt: true }).parse(req.body);
      
      // Add the user ID to the estimate
      const estimateWithUser = {
        ...validatedData,
        userId
      };
      
      const estimate = await storage.createMoveEstimate(estimateWithUser);
      res.status(201).json(estimate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: 'Validation error',
          errors: validationError.details
        });
      } else {
        console.error('Error saving estimate:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  // Checklist API endpoints
  
  // Create a new moving checklist
  app.post('/api/checklists', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = insertMoveChecklistSchema.omit({ createdAt: true }).parse(req.body);
      
      // Make sure we have all required fields
      if (!validatedData.moveDate) {
        return res.status(400).json({ message: 'Move date is required' });
      }
      
      // Add the user ID to the checklist
      const checklistWithUser = {
        moveDate: validatedData.moveDate,
        estimateId: validatedData.estimateId || null,
        userId
      };
      
      const checklist = await storage.createMoveChecklist(checklistWithUser);
      
      // Generate initial checklist items based on move date
      const moveDate = new Date(checklist.moveDate);
      await generateDefaultChecklistItems(checklist.id, moveDate);
      
      // Get the generated items
      const items = await storage.getChecklistItems(checklist.id);
      
      res.status(201).json({
        checklist,
        items
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: 'Validation error',
          errors: validationError.details
        });
      } else {
        console.error('Error creating checklist:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
  
  // Get all checklists for the current user
  app.get('/api/checklists', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      const checklists = await storage.getUserChecklists(userId);
      res.json(checklists);
    } catch (error) {
      console.error('Error retrieving checklists:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get a specific checklist with its items
  app.get('/api/checklists/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const checklistId = parseInt(req.params.id);
      const checklist = await storage.getMoveChecklist(checklistId);
      
      if (!checklist) {
        return res.status(404).json({ message: 'Checklist not found' });
      }
      
      // Check if this checklist belongs to the current user
      if (checklist.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Unauthorized access to this checklist' });
      }
      
      const items = await storage.getChecklistItems(checklistId);
      
      res.json({
        checklist,
        items
      });
    } catch (error) {
      console.error('Error retrieving checklist:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get a checklist for a specific estimate
  app.get('/api/estimates/:id/checklist', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const estimateId = parseInt(req.params.id);
      const checklist = await storage.getChecklistByEstimate(estimateId);
      
      if (!checklist) {
        return res.status(404).json({ message: 'No checklist found for this estimate' });
      }
      
      // Check if this checklist belongs to the current user
      if (checklist.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Unauthorized access to this checklist' });
      }
      
      const items = await storage.getChecklistItems(checklist.id);
      
      res.json({
        checklist,
        items
      });
    } catch (error) {
      console.error('Error retrieving estimate checklist:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update a checklist item (mark as complete/incomplete)
  app.patch('/api/checklist-items/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      const { completed } = req.body;
      
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'The completed property must be a boolean' });
      }
      
      const updatedItem = await storage.updateChecklistItem(itemId, completed);
      
      if (!updatedItem) {
        return res.status(404).json({ message: 'Checklist item not found' });
      }
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating checklist item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Moving cost heatmap API endpoint
  app.get('/api/moving-costs-map', async (req, res) => {
    try {
      const origin = req.query.origin as string || 'New York, NY';
      const homeSize = req.query.homeSize as string || '2bedroom';
      
      // Generate the state-by-state cost data
      const costData = generateStateMovingCosts(origin, homeSize);
      
      res.json(costData);
    } catch (error) {
      console.error('Error generating moving costs map data:', error);
      res.status(500).json({ message: 'Error generating moving costs map data' });
    }
  });

  // User progress API endpoints for gamification
  
  // Get user progress
  app.get('/api/user-progress', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      let progress = await storage.getUserProgress(userId);
      
      // If no progress exists yet, create a new one for the user
      if (!progress) {
        progress = await storage.createUserProgress({
          userId,
          points: 0,
          level: 1,
          achievements: [],
          streak: 0,
          lastInteraction: new Date().toISOString()
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error('Error retrieving user progress:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update user progress
  app.patch('/api/user-progress', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      
      // Validate request data
      const validatedData = insertUserProgressSchema
        .partial()
        .omit({ userId: true, createdAt: true })
        .parse(req.body);
      
      // Get existing progress or create new
      let progress = await storage.getUserProgress(userId);
      
      if (!progress) {
        // Create new progress with default values
        progress = await storage.createUserProgress({
          userId,
          points: validatedData.points || 0,
          level: validatedData.level || 1,
          achievements: validatedData.achievements || [],
          streak: validatedData.streak || 0,
          lastInteraction: validatedData.lastInteraction || new Date().toISOString()
        });
      } else {
        // Update existing progress
        progress = await storage.updateUserProgress(userId, validatedData);
      }
      
      if (!progress) {
        return res.status(404).json({ message: 'Failed to update user progress' });
      }
      
      res.json(progress);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: 'Validation error',
          errors: validationError.details
        });
      } else {
        console.error('Error updating user progress:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
  
  // Unlock a new achievement
  app.post('/api/unlock-achievement', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const userId = req.user!.id;
      const { achievementId, points } = req.body;
      
      if (!achievementId || typeof achievementId !== 'string') {
        return res.status(400).json({ message: 'Achievement ID is required' });
      }
      
      // Get existing progress
      let progress = await storage.getUserProgress(userId);
      
      if (!progress) {
        // Create new progress if it doesn't exist
        progress = await storage.createUserProgress({
          userId,
          points: points || 0,
          level: 1,
          achievements: [achievementId],
          streak: 0,
          lastInteraction: new Date().toISOString()
        });
      } else {
        // Check if achievement already unlocked
        if (progress.achievements.includes(achievementId)) {
          return res.json({
            success: false,
            message: 'Achievement already unlocked',
            progress
          });
        }
        
        // Add achievement and points
        const updatedAchievements = [...progress.achievements, achievementId];
        const updatedPoints = progress.points + (points || 0);
        
        // Calculate new level (every 100 points is a new level)
        const updatedLevel = Math.floor(updatedPoints / 100) + 1;
        
        // Update progress
        progress = await storage.updateUserProgress(userId, {
          achievements: updatedAchievements,
          points: updatedPoints,
          level: updatedLevel,
          lastInteraction: new Date().toISOString()
        });
      }
      
      if (!progress) {
        return res.status(404).json({ message: 'Failed to update user progress' });
      }
      
      res.json({
        success: true,
        message: 'Achievement unlocked',
        progress
      });
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate moving costs
async function calculateMovingCosts(data: any): Promise<MoveCalculationResponse> {
  // Calculate distance between origin and destination
  // In a real app, we would use a mapping API like Google Maps Distance Matrix
  // For the demo, we'll use a random distance between 10 and 500 miles
  const distance = calculateDistance(data.origin, data.destination);
  
  // Calculate base costs based on home size
  const baseCosts = BASE_COSTS[data.homeSize];
  
  // Add distance costs
  const costDiy = Math.round(baseCosts.diy + (distance * COST_PER_MILE.diy));
  const costHybrid = Math.round(baseCosts.hybrid + (distance * COST_PER_MILE.hybrid));
  const costFullService = Math.round(baseCosts.fullService + (distance * COST_PER_MILE.fullService));
  
  // Add costs for additional items
  const additionalCosts = ADDITIONAL_ITEM_COSTS[data.additionalItems];
  const diy = costDiy + additionalCosts.diy;
  const hybrid = costHybrid + additionalCosts.hybrid;
  const fullService = costFullService + additionalCosts.fullService;
  
  // Add extra costs for services
  const servicesCost = calculateServicesCost(data.services);
  
  // Cost breakdown percentages
  const totalCost = hybrid; // Using hybrid as the reference cost
  const transportationCost = Math.round(totalCost * 0.45);
  const laborCost = Math.round(totalCost * 0.30);
  const materialsCost = Math.round(totalCost * 0.15);
  const otherCost = Math.round(totalCost * 0.10);
  
  // Get recommended companies
  // In a real app, this would query a database of moving companies based on location
  const companies = SAMPLE_COMPANIES.map(company => ({
    ...company,
    available: Math.random() > 0.3 // Randomize availability for demo
  }));

  return {
    distance,
    origin: data.origin,
    destination: data.destination,
    homeSize: data.homeSize,
    moveDate: data.moveDate,
    costs: {
      diy: diy + servicesCost.diy,
      hybrid: hybrid + servicesCost.hybrid,
      fullService: fullService + servicesCost.fullService,
    },
    breakdown: {
      transportation: transportationCost,
      labor: laborCost,
      materials: materialsCost,
      other: otherCost,
    },
    companies: companies.slice(0, 2), // Return only 2 companies
  };
}

// Helper function to calculate distance between two addresses
function calculateDistance(origin: string, destination: string): number {
  // In a real app, we would use a mapping API
  // For the demo, we'll generate a sensible random distance
  
  // Check if origin and destination contain some of the same location information
  const originLower = origin.toLowerCase();
  const destLower = destination.toLowerCase();
  
  // Extract city/state from addresses (very simplistic)
  const originParts = originLower.split(',').map(p => p.trim());
  const destParts = destLower.split(',').map(p => p.trim());
  
  // Check if the addresses share a city/state
  const sameCity = originParts.some(part => destParts.includes(part));
  
  if (sameCity) {
    // Local move (5-25 miles)
    return Math.floor(Math.random() * 20) + 5;
  } else {
    // Extract states (if present)
    const originState = originParts.length > 1 ? originParts[originParts.length - 1] : '';
    const destState = destParts.length > 1 ? destParts[destParts.length - 1] : '';
    
    if (originState === destState && originState !== '') {
      // In-state move (25-200 miles)
      return Math.floor(Math.random() * 175) + 25;
    } else {
      // Long-distance move (200-3000 miles)
      return Math.floor(Math.random() * 2800) + 200;
    }
  }
}

// Helper function to calculate costs for additional services
function calculateServicesCost(services: string[]): { diy: number, hybrid: number, fullService: number } {
  const costs = { diy: 0, hybrid: 0, fullService: 0 };
  
  services.forEach(service => {
    switch (service) {
      case 'packing':
        costs.diy += 100;
        costs.hybrid += 200;
        costs.fullService += 0; // Already included
        break;
      case 'storage':
        costs.diy += 150;
        costs.hybrid += 150;
        costs.fullService += 150;
        break;
      case 'cleaning':
        costs.diy += 200;
        costs.hybrid += 200;
        costs.fullService += 200;
        break;
    }
  });
  
  return costs;
}

// Helper function to generate moving cost data for the heatmap
function generateStateMovingCosts(origin: string, homeSize: string) {
  // Major US states/cities with coordinates
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
    { state: "Pittsburgh, PA", code: "PA2", coordinates: [-79.9959, 40.4406], baseCost: 2050, popularity: 50 },
    { state: "Raleigh, NC", code: "NC2", coordinates: [-78.6382, 35.7796], baseCost: 2100, popularity: 60 },
    { state: "Baltimore, MD", code: "MD", coordinates: [-76.6122, 39.2904], baseCost: 2200, popularity: 55 },
    { state: "St. Louis, MO", code: "MO2", coordinates: [-90.1994, 38.6270], baseCost: 1950, popularity: 45 },
    { state: "Sacramento, CA", code: "CA4", coordinates: [-121.4944, 38.5816], baseCost: 2400, popularity: 60 },
    { state: "Tucson, AZ", code: "AZ2", coordinates: [-110.9747, 32.2226], baseCost: 1950, popularity: 55 },
    { state: "Omaha, NE", code: "NE", coordinates: [-95.9979, 41.2565], baseCost: 1850, popularity: 45 },
    { state: "Oklahoma City, OK", code: "OK", coordinates: [-97.5164, 35.4676], baseCost: 1900, popularity: 50 },
    { state: "Albuquerque, NM", code: "NM", coordinates: [-106.6504, 35.0844], baseCost: 2000, popularity: 45 },
    { state: "Memphis, TN", code: "TN2", coordinates: [-90.0490, 35.1495], baseCost: 1950, popularity: 50 },
    { state: "Louisville, KY", code: "KY", coordinates: [-85.7585, 38.2542], baseCost: 1900, popularity: 45 },
    { state: "Buffalo, NY", code: "NY2", coordinates: [-78.8784, 42.8864], baseCost: 2100, popularity: 40 },
    { state: "Richmond, VA", code: "VA", coordinates: [-77.4360, 37.5407], baseCost: 2150, popularity: 50 },
    { state: "Boise, ID", code: "ID", coordinates: [-116.2023, 43.6150], baseCost: 2100, popularity: 55 },
    { state: "Des Moines, IA", code: "IA", coordinates: [-93.6091, 41.5868], baseCost: 1850, popularity: 40 },
    { state: "Charleston, SC", code: "SC", coordinates: [-79.9311, 32.7765], baseCost: 2150, popularity: 60 },
    { state: "Jackson, MS", code: "MS", coordinates: [-90.1848, 32.2988], baseCost: 1900, popularity: 40 },
    { state: "Birmingham, AL", code: "AL", coordinates: [-86.8103, 33.5207], baseCost: 1950, popularity: 45 },
    { state: "Providence, RI", code: "RI", coordinates: [-71.4128, 41.8240], baseCost: 2250, popularity: 50 },
    { state: "Hartford, CT", code: "CT", coordinates: [-72.6830, 41.7658], baseCost: 2300, popularity: 45 },
    { state: "Concord, NH", code: "NH", coordinates: [-71.5372, 43.2081], baseCost: 2200, popularity: 40 },
    { state: "Burlington, VT", code: "VT", coordinates: [-73.2121, 44.4759], baseCost: 2150, popularity: 40 },
    { state: "Augusta, ME", code: "ME", coordinates: [-69.7795, 44.3106], baseCost: 2250, popularity: 35 },
    { state: "Honolulu, HI", code: "HI", coordinates: [-157.8583, 21.3069], baseCost: 4500, popularity: 75 },
    { state: "Anchorage, AK", code: "AK", coordinates: [-149.9003, 61.2181], baseCost: 4000, popularity: 30 },
  ];
  
  // Find origin city
  const originCity = stateData.find(city => city.state.includes(origin.split(',')[0])) || stateData[0];
  
  // Adjust costs based on distance from origin and home size
  return stateData.map(city => {
    // Get coordinates
    const lat1 = originCity.coordinates[1];
    const lon1 = originCity.coordinates[0];
    const lat2 = city.coordinates[1];
    const lon2 = city.coordinates[0];
    
    // Calculate distance
    const distance = calculateGeoDistance(lat1, lon1, lat2, lon2);
    
    // Adjust cost based on distance, home size, and regional cost factors
    const homeSizeMultiplier = 
      homeSize === "studio" ? 0.6 : 
      homeSize === "1bedroom" ? 0.8 :
      homeSize === "2bedroom" ? 1.0 :
      homeSize === "3bedroom" ? 1.3 : 1.5;
    
    // Calculate base cost adjusted for home size
    const baseCost = Math.round(city.baseCost * homeSizeMultiplier);
    
    // Apply distance factor (higher distance = higher cost)
    const distanceFactor = distance / 1000; // Normalize distance effect
    const hybridCost = Math.round(baseCost * (1 + distanceFactor));
    
    // Calculate different moving method costs
    const diyCost = Math.round(hybridCost * 0.6); // DIY is cheaper
    const fullServiceCost = Math.round(hybridCost * 1.7); // Full service is more expensive
    
    // Popularity decreases with distance but has a minimum value
    const popularity = Math.max(20, city.popularity - (distance / 500));
    
    return {
      state: city.state,
      code: city.code,
      coordinates: city.coordinates as [number, number],
      hybridCost,
      diyCost,
      fullServiceCost,
      popularity
    };
  });
}

// Calculate distance between two geographic coordinates using Haversine formula
function calculateGeoDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Helper function to generate default checklist items for a new checklist
async function generateDefaultChecklistItems(checklistId: number, moveDate: Date): Promise<void> {
  // Calculate different time periods relative to move date
  const eightWeeksBefore = new Date(moveDate);
  eightWeeksBefore.setDate(moveDate.getDate() - 56);
  
  const fourWeeksBefore = new Date(moveDate);
  fourWeeksBefore.setDate(moveDate.getDate() - 28);
  
  const twoWeeksBefore = new Date(moveDate);
  twoWeeksBefore.setDate(moveDate.getDate() - 14);
  
  const oneWeekBefore = new Date(moveDate);
  oneWeekBefore.setDate(moveDate.getDate() - 7);
  
  const oneWeekAfter = new Date(moveDate);
  oneWeekAfter.setDate(moveDate.getDate() + 7);
  
  // Default checklist items
  const checklistItems = [
    // 8 weeks before (planning phase)
    {
      checklistId,
      task: "Create a moving budget",
      description: "Estimate all costs involved in your move including packing supplies, movers, transportation, etc.",
      category: "planning",
      timeframe: "8-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Research moving companies",
      description: "Get quotes from at least 3 different moving companies for comparison.",
      category: "planning",
      timeframe: "8-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Create a home inventory",
      description: "Document all your belongings and decide what to keep, sell, donate, or discard.",
      category: "planning",
      timeframe: "8-weeks",
      completed: false
    },
    
    // 4 weeks before (preparation phase)
    {
      checklistId,
      task: "Start packing non-essential items",
      description: "Begin with items you rarely use like seasonal decorations, books, and extra kitchen items.",
      category: "packing",
      timeframe: "4-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Notify important parties about your move",
      description: "Update your address with banks, insurance companies, subscription services, etc.",
      category: "admin",
      timeframe: "4-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Schedule utility disconnection and connection",
      description: "Arrange for utilities to be disconnected at your current home and connected at your new home.",
      category: "admin",
      timeframe: "4-weeks",
      completed: false
    },
    
    // 2 weeks before (action phase)
    {
      checklistId,
      task: "Confirm moving arrangements",
      description: "Verify date, time, and details with your moving company or rental truck service.",
      category: "admin",
      timeframe: "2-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Pack most of your belongings",
      description: "Leave out only essential items that you'll need in the final days.",
      category: "packing",
      timeframe: "2-weeks",
      completed: false
    },
    {
      checklistId,
      task: "Clean out the refrigerator and pantry",
      description: "Use up perishable food items or plan to give them away before the move.",
      category: "cleaning",
      timeframe: "2-weeks",
      completed: false
    },
    
    // 1 week before (final prep)
    {
      checklistId,
      task: "Pack an essentials box",
      description: "Include items you'll need immediately upon arrival: toiletries, medications, change of clothes, basic kitchen supplies, etc.",
      category: "packing",
      timeframe: "1-week",
      completed: false
    },
    {
      checklistId,
      task: "Disassemble furniture",
      description: "Take apart larger furniture pieces that won't fit through doors or are easier to move disassembled.",
      category: "packing",
      timeframe: "1-week",
      completed: false
    },
    {
      checklistId,
      task: "Confirm arrival time at new residence",
      description: "Make sure you can access your new home when you arrive and that utilities are connected.",
      category: "admin",
      timeframe: "1-week",
      completed: false
    },
    
    // Moving day
    {
      checklistId,
      task: "Conduct final walkthrough of old home",
      description: "Check all rooms, closets, cabinets, and storage areas to ensure nothing is left behind.",
      category: "moving-day",
      timeframe: "moving-day",
      completed: false
    },
    {
      checklistId,
      task: "Document condition of rental property",
      description: "Take photos of your cleaned rental property to document its condition for your deposit return.",
      category: "moving-day",
      timeframe: "moving-day",
      completed: false
    },
    {
      checklistId,
      task: "Supervise movers",
      description: "Be available to answer questions and direct movers throughout the loading process.",
      category: "moving-day",
      timeframe: "moving-day",
      completed: false
    },
    
    // After the move
    {
      checklistId,
      task: "Unpack essential items",
      description: "Focus on setting up the kitchen, bathroom, and bedroom areas first.",
      category: "unpacking",
      timeframe: "after-move",
      completed: false
    },
    {
      checklistId,
      task: "Update your address",
      description: "File a change of address with the post office and update your driver's license.",
      category: "admin",
      timeframe: "after-move",
      completed: false
    },
    {
      checklistId,
      task: "Meet your neighbors",
      description: "Introduce yourself to neighbors and begin getting familiar with the neighborhood.",
      category: "settling-in",
      timeframe: "after-move",
      completed: false
    }
  ];
  
  // Save each checklist item to storage
  for (const item of checklistItems) {
    await storage.createChecklistItem(item);
  }
}
