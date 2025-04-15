import { users, movingEstimates, type User, type InsertUser, type MoveEstimate, type InsertMoveEstimate } from "@shared/schema";
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
  
  // Session store for authentication
  sessionStore: session.Store;
}

// In-memory storage implementation (kept for reference or fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moveEstimates: Map<number, MoveEstimate>;
  private currentUserId: number;
  private currentEstimateId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.moveEstimates = new Map();
    this.currentUserId = 1;
    this.currentEstimateId = 1;
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
    const estimate: MoveEstimate = { 
      ...insertEstimate, 
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
    const estimateData = {
      ...insertEstimate,
      // Ensure all fields have proper types
      userId: insertEstimate.userId || null,
      additionalItems: insertEstimate.additionalItems || null,
      flexibility: insertEstimate.flexibility || null,
      services: insertEstimate.services || []
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
}

// Uncomment this line to use DatabaseStorage when database is available
// export const storage = new DatabaseStorage();

// Use in-memory storage for now until we have a proper database connection
export const storage = new MemStorage();
