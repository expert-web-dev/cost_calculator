import { users, type User, type InsertUser, type MoveEstimate, type InsertMoveEstimate } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private moveEstimates: Map<number, MoveEstimate>;
  private currentUserId: number;
  private currentEstimateId: number;

  constructor() {
    this.users = new Map();
    this.moveEstimates = new Map();
    this.currentUserId = 1;
    this.currentEstimateId = 1;
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
}

export const storage = new MemStorage();
