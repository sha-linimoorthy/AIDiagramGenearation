import { users, type User, type InsertUser, type Chart, type InsertChart } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chart methods
  createChart(chart: InsertChart): Promise<Chart>;
  getChart(id: number): Promise<Chart | undefined>;
  getAllCharts(): Promise<Chart[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private charts: Map<number, Chart>;
  currentUserId: number;
  currentChartId: number;

  constructor() {
    this.users = new Map();
    this.charts = new Map();
    this.currentUserId = 1;
    this.currentChartId = 1;
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
  
  // Chart methods
  async createChart(insertChart: InsertChart): Promise<Chart> {
    const id = this.currentChartId++;
    const createdAt = new Date();
    // Ensure userId is null if it's undefined
    const userId = insertChart.userId === undefined ? null : insertChart.userId;
    
    const chart: Chart = { 
      ...insertChart, 
      id,
      createdAt,
      userId
    };
    this.charts.set(id, chart);
    return chart;
  }
  
  async getChart(id: number): Promise<Chart | undefined> {
    return this.charts.get(id);
  }
  
  async getAllCharts(): Promise<Chart[]> {
    return Array.from(this.charts.values());
  }
}

export const storage = new MemStorage();
