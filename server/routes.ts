import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  moveCalculationRequestSchema, 
  type MoveCalculationResponse,
  insertMoveEstimateSchema,
  insertMoveChecklistSchema,
  insertChecklistItemSchema
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
      
      // Add the user ID to the checklist
      const checklistWithUser = {
        ...validatedData,
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
