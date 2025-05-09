import { 
  users, movingEstimates, movingChecklists, checklistItems, userProgress,
  type User, type InsertUser, 
  type MoveEstimate, type InsertMoveEstimate,
  type MoveChecklist, type InsertMoveChecklist,
  type ChecklistItem, type InsertChecklistItem,
  type UserProgress, type InsertUserProgress
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Moving estimate storage methods
  createMoveEstimate(estimate: InsertMoveEstimate): Promise<MoveEstimate>;
  getMoveEstimate(id: number): Promise<MoveEstimate | undefined>;
  getAllMoveEstimates(): Promise<MoveEstimate[]>;
  getUserEstimates(userId: number): Promise<MoveEstimate[]>;
  
  // Moving checklist methods
  createMoveChecklist(checklist: InsertMoveChecklist): Promise<MoveChecklist>;
  getMoveChecklist(id: number): Promise<MoveChecklist | undefined>;
  getUserChecklists(userId: number): Promise<MoveChecklist[]>;
  getChecklistByEstimate(estimateId: number): Promise<MoveChecklist | undefined>;
  
  // Checklist items methods
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  getChecklistItems(checklistId: number): Promise<ChecklistItem[]>;
  updateChecklistItem(id: number, completed: boolean): Promise<ChecklistItem | undefined>;
  
  // User progress methods for gamification
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(userId: number, progress: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

// In-memory storage implementation (kept for reference or fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moveEstimates: Map<number, MoveEstimate>;
  private moveChecklists: Map<number, MoveChecklist>;
  private checklistItems: Map<number, ChecklistItem>;
  private userProgressMap: Map<number, UserProgress>;
  private currentUserId: number;
  private currentEstimateId: number;
  private currentChecklistId: number;
  private currentChecklistItemId: number;
  private currentProgressId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.moveEstimates = new Map();
    this.moveChecklists = new Map();
    this.checklistItems = new Map();
    this.userProgressMap = new Map();
    this.currentUserId = 1;
    this.currentEstimateId = 1;
    this.currentChecklistId = 1;
    this.currentChecklistItemId = 1;
    this.currentProgressId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async createMoveEstimate(insertEstimate: InsertMoveEstimate): Promise<MoveEstimate> {
    const id = this.currentEstimateId++;
    const now = new Date().toISOString();
    
    // Ensure all fields have proper types
    const estimate: MoveEstimate = { 
      ...insertEstimate,
      userId: insertEstimate.userId || null,
      additionalItems: insertEstimate.additionalItems || null,
      flexibility: insertEstimate.flexibility || null,
      services: Array.isArray(insertEstimate.services) ? insertEstimate.services : [],
      id, 
      createdAt: now 
    };
    
    this.moveEstimates.set(id, estimate);
    return estimate;
  }
  
  async getMoveEstimate(id: number): Promise<MoveEstimate | undefined> {
    return this.moveEstimates.get(id);
  }
  
  async getAllMoveEstimates(): Promise<MoveEstimate[]> {
    return Array.from(this.moveEstimates.values());
  }
  
  async getUserEstimates(userId: number): Promise<MoveEstimate[]> {
    return Array.from(this.moveEstimates.values())
      .filter(estimate => estimate.userId === userId);
  }
  
  // Moving checklist methods
  async createMoveChecklist(insertChecklist: InsertMoveChecklist): Promise<MoveChecklist> {
    const id = this.currentChecklistId++;
    const now = new Date().toISOString();
    
    // Ensure all fields have proper types
    const checklist: MoveChecklist = {
      ...insertChecklist,
      userId: insertChecklist.userId,
      estimateId: insertChecklist.estimateId || null,
      id,
      createdAt: now
    };
    
    this.moveChecklists.set(id, checklist);
    return checklist;
  }
  
  async getMoveChecklist(id: number): Promise<MoveChecklist | undefined> {
    return this.moveChecklists.get(id);
  }
  
  async getUserChecklists(userId: number): Promise<MoveChecklist[]> {
    return Array.from(this.moveChecklists.values())
      .filter(checklist => checklist.userId === userId);
  }
  
  async getChecklistByEstimate(estimateId: number): Promise<MoveChecklist | undefined> {
    return Array.from(this.moveChecklists.values())
      .find(checklist => checklist.estimateId === estimateId);
  }
  
  // Checklist items methods
  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.currentChecklistItemId++;
    const now = new Date().toISOString();
    
    // Ensure all fields have proper types
    const item: ChecklistItem = {
      ...insertItem,
      description: insertItem.description || null,
      completed: insertItem.completed !== undefined ? insertItem.completed : false,
      id,
      createdAt: now
    };
    
    this.checklistItems.set(id, item);
    return item;
  }
  
  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.checklistId === checklistId);
  }
  
  async updateChecklistItem(id: number, completed: boolean): Promise<ChecklistItem | undefined> {
    const item = this.checklistItems.get(id);
    if (!item) return undefined;
    
    const updatedItem: ChecklistItem = {
      ...item,
      completed
    };
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // User progress methods for gamification
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgressMap.values())
      .find(progress => progress.userId === userId);
  }
  
  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentProgressId++;
    const now = new Date().toISOString();
    
    // Ensure all fields have proper types with defaults
    const progress: UserProgress = {
      ...insertProgress,
      points: insertProgress.points !== undefined ? insertProgress.points : 0,
      level: insertProgress.level !== undefined ? insertProgress.level : 1,
      streak: insertProgress.streak !== undefined ? insertProgress.streak : 0,
      lastInteraction: insertProgress.lastInteraction || now,
      achievements: Array.isArray(insertProgress.achievements) ? insertProgress.achievements : [],
      id,
      createdAt: now
    };
    
    this.userProgressMap.set(id, progress);
    return progress;
  }
  
  async updateUserProgress(userId: number, progressUpdate: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const progress = Array.from(this.userProgressMap.values())
      .find(p => p.userId === userId);
    
    if (!progress) return undefined;
    
    const updatedProgress: UserProgress = {
      ...progress,
      ...progressUpdate,
      achievements: progressUpdate.achievements || progress.achievements
    };
    
    this.userProgressMap.set(progress.id, updatedProgress);
    return updatedProgress;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // When we have a real PostgreSQL database, use this
    // const PostgresSessionStore = connectPg(session);
    // this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
    
    // For now, use memory store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async createMoveEstimate(insertEstimate: InsertMoveEstimate): Promise<MoveEstimate> {
    // Extract required properties
    const { 
      origin, 
      destination, 
      distance,
      homeSize,
      moveDate,
      costDiy,
      costHybrid,
      costFullService
    } = insertEstimate;
    
    // Prepare data with proper types for optional fields
    const estimateData = {
      origin,
      destination,
      distance,
      homeSize,
      moveDate,
      costDiy,
      costHybrid,
      costFullService,
      userId: insertEstimate.userId || null,
      additionalItems: insertEstimate.additionalItems || null,
      flexibility: insertEstimate.flexibility || null,
      services: Array.isArray(insertEstimate.services) ? insertEstimate.services : []
    };
    
    const [estimate] = await db
      .insert(movingEstimates)
      .values(estimateData)
      .returning();
    return estimate;
  }
  
  async getMoveEstimate(id: number): Promise<MoveEstimate | undefined> {
    const [estimate] = await db.select().from(movingEstimates).where(eq(movingEstimates.id, id));
    return estimate || undefined;
  }
  
  async getAllMoveEstimates(): Promise<MoveEstimate[]> {
    return db.select().from(movingEstimates);
  }
  
  async getUserEstimates(userId: number): Promise<MoveEstimate[]> {
    return db.select().from(movingEstimates).where(eq(movingEstimates.userId, userId));
  }
  
  // Moving checklist methods
  async createMoveChecklist(insertChecklist: InsertMoveChecklist): Promise<MoveChecklist> {
    // Extract required properties
    const { userId, moveDate } = insertChecklist;
    
    // Prepare data with proper types for optional fields
    const checklistData = {
      userId,
      moveDate,
      estimateId: insertChecklist.estimateId || null
    };
    
    const [checklist] = await db
      .insert(movingChecklists)
      .values(checklistData)
      .returning();
    return checklist;
  }
  
  async getMoveChecklist(id: number): Promise<MoveChecklist | undefined> {
    const [checklist] = await db.select().from(movingChecklists).where(eq(movingChecklists.id, id));
    return checklist || undefined;
  }
  
  async getUserChecklists(userId: number): Promise<MoveChecklist[]> {
    return db.select().from(movingChecklists).where(eq(movingChecklists.userId, userId));
  }
  
  async getChecklistByEstimate(estimateId: number): Promise<MoveChecklist | undefined> {
    const [checklist] = await db.select().from(movingChecklists).where(eq(movingChecklists.estimateId, estimateId));
    return checklist || undefined;
  }
  
  // Checklist items methods
  async createChecklistItem(insertItem: InsertChecklistItem): Promise<ChecklistItem> {
    const itemData = {
      ...insertItem,
      description: insertItem.description || null,
      completed: insertItem.completed !== undefined ? insertItem.completed : false
    };
    
    const [item] = await db
      .insert(checklistItems)
      .values(itemData)
      .returning();
    return item;
  }
  
  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    return db.select().from(checklistItems).where(eq(checklistItems.checklistId, checklistId));
  }
  
  async updateChecklistItem(id: number, completed: boolean): Promise<ChecklistItem | undefined> {
    const [item] = await db
      .update(checklistItems)
      .set({ completed })
      .where(eq(checklistItems.id, id))
      .returning();
    return item || undefined;
  }
  
  // User progress methods for gamification
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.userId, userId));
    return progress || undefined;
  }
  
  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const now = new Date().toISOString();
    
    // Ensure all fields have proper types with defaults
    const progressData = {
      ...insertProgress,
      points: insertProgress.points !== undefined ? insertProgress.points : 0,
      level: insertProgress.level !== undefined ? insertProgress.level : 1,
      streak: insertProgress.streak !== undefined ? insertProgress.streak : 0,
      lastInteraction: insertProgress.lastInteraction || now,
      achievements: Array.isArray(insertProgress.achievements) ? insertProgress.achievements : []
    };
    
    const [progress] = await db
      .insert(userProgress)
      .values(progressData)
      .returning();
    return progress;
  }
  
  async updateUserProgress(userId: number, progressUpdate: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    // Get existing progress first
    const existingProgress = await this.getUserProgress(userId);
    if (!existingProgress) return undefined;
    
    // Create updated record with proper handling of arrays
    const updatedData: Partial<UserProgress> = {
      ...progressUpdate
    };
    
    // Only include achievements if provided
    if (progressUpdate.achievements) {
      updatedData.achievements = progressUpdate.achievements;
    }
    
    const [progress] = await db
      .update(userProgress)
      .set(updatedData)
      .where(eq(userProgress.userId, userId))
      .returning();
    return progress || undefined;
  }
}

// Uncomment this line to use DatabaseStorage when database is available
// export const storage = new DatabaseStorage();

// Use in-memory storage for now until we have a proper database connection
export const storage = new MemStorage();
