import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  moveCalculationRequestSchema, 
  type MoveCalculationResponse,
  insertMoveEstimateSchema
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
