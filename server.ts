import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("work_intelligence.db");

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'todo',
    estimated_hours REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS time_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    hours REAL,
    date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS task_tags (
    task_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY(task_id, tag_id),
    FOREIGN KEY(task_id) REFERENCES tasks(id),
    FOREIGN KEY(tag_id) REFERENCES tags(id)
  );

  CREATE TABLE IF NOT EXISTS ai_action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT,
    details TEXT,
    outcome TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Seed some data if empty
  INSERT OR IGNORE INTO projects (name, description) VALUES ('Project Atlas', 'Core infrastructure redesign');
  INSERT OR IGNORE INTO projects (name, description) VALUES ('Internal Tools', 'Efficiency improvements');
`);

// --- Database Migrations ---
try {
  db.prepare("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME").run();
  console.log("Migration: Added deleted_at column to tasks table");
} catch (e: any) { }

try {
  db.prepare("ALTER TABLE projects ADD COLUMN deleted_at DATETIME").run();
  console.log("Migration: Added deleted_at column to projects table");
} catch (e: any) { }

// --- Error Logging Helper ---
const logError = (context: string, error: any) => {
  console.error(`[ERROR] ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());

  const PORT = 3000;

  // --- AI Tool Implementations ---
  const tools = {
    create_task: (args: any) => {
      try {
        const { title, description, project_id, priority, estimated_hours } = args;

        // Validate project exists
        const projectExists = db.prepare('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL').get(project_id);
        if (!projectExists) {
          return { success: false, error: `Cannot create task. Project with ID ${project_id} does not exist or has been deleted.` };
        }

        const stmt = db.prepare('INSERT INTO tasks (title, description, project_id, priority, estimated_hours) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(title, description, project_id, priority, estimated_hours);
        const result = { success: true, task_id: info.lastInsertRowid };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('create_task', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('create_task', error);
        return { success: false, error: `Failed to create task: ${error.message}` };
      }
    },
    update_task: (args: any) => {
      try {
        const { task_id, status, priority, title } = args;
        const updates: string[] = [];
        const values: any[] = [];
        if (status) { updates.push('status = ?'); values.push(status); }
        if (priority) { updates.push('priority = ?'); values.push(priority); }
        if (title) { updates.push('title = ?'); values.push(title); }

        if (updates.length === 0) return { success: false, error: "No fields provided for update" };

        const query = `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        values.push(task_id);
        const result_db = db.prepare(query).run(...values);

        if (result_db.changes === 0) {
          return { success: false, error: `Task with ID ${task_id} not found` };
        }

        const result = { success: true };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('update_task', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('update_task', error);
        return { success: false, error: `Failed to update task: ${error.message}` };
      }
    },
    delete_task: (args: any) => {
      try {
        const { task_id, confirmed } = args;
        if (!confirmed) {
          return { success: false, error: "Confirmation required. Please ask the user to confirm deletion." };
        }
        const result_db = db.prepare('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(task_id);

        if (result_db.changes === 0) {
          return { success: false, error: `Task with ID ${task_id} not found` };
        }

        const result = { success: true };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('delete_task', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('delete_task', error);
        return { success: false, error: `Failed to delete task: ${error.message}` };
      }
    },
    create_project: (args: any) => {
      try {
        const { name, description } = args;
        const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
        const info = stmt.run(name, description);
        const result = { success: true, project_id: info.lastInsertRowid };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('create_project', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('create_project', error);
        return { success: false, error: `Failed to create project: ${error.message}` };
      }
    },
    update_project: (args: any) => {
      try {
        const { project_id, name, description, status } = args;
        const updates: string[] = [];
        const values: any[] = [];
        if (name) { updates.push('name = ?'); values.push(name); }
        if (description) { updates.push('description = ?'); values.push(description); }
        if (status) { updates.push('status = ?'); values.push(status); }

        if (updates.length === 0) return { success: false, error: "No fields provided for update" };

        const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
        values.push(project_id);
        const result_db = db.prepare(query).run(...values);

        if (result_db.changes === 0) {
          return { success: false, error: `Project with ID ${project_id} not found` };
        }

        const result = { success: true };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('update_project', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('update_project', error);
        return { success: false, error: `Failed to update project: ${error.message}` };
      }
    },
    delete_project: (args: any) => {
      try {
        const { project_id, confirmed } = args;
        if (!confirmed) {
          return { success: false, error: "Confirmation required. Please ask the user to confirm deletion of the project and all its tasks." };
        }

        // Soft delete project
        const result_db = db.prepare('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(project_id);

        if (result_db.changes === 0) {
          return { success: false, error: `Project with ID ${project_id} not found` };
        }

        // Get tasks that are about to be soft deleted
        const tasksToDelete = db.prepare('SELECT id FROM tasks WHERE project_id = ? AND deleted_at IS NULL').all(project_id) as { id: number }[];
        const deletedTaskIds = tasksToDelete.map(t => t.id);

        // Also soft delete all tasks in that project
        db.prepare('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = ? AND deleted_at IS NULL').run(project_id);

        const result = { success: true, deleted_task_ids: deletedTaskIds };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('delete_project', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('delete_project', error);
        return { success: false, error: `Failed to delete project: ${error.message}` };
      }
    },
    log_time: (args: any) => {
      try {
        const { task_id, hours, date } = args;
        const stmt = db.prepare('INSERT INTO time_logs (task_id, hours, date) VALUES (?, ?, ?)');
        stmt.run(task_id, hours, date || new Date().toISOString().split('T')[0]);
        const result = { success: true };
        db.prepare('INSERT INTO ai_action_logs (action_type, details, outcome) VALUES (?, ?, ?)').run('log_time', JSON.stringify(args), JSON.stringify(result));
        return result;
      } catch (error: any) {
        logError('log_time', error);
        return { success: false, error: `Failed to log time: ${error.message}` };
      }
    },
    get_tasks: (args: any) => {
      try {
        const tasks = db.prepare(`
          SELECT t.*, p.name as project_name 
          FROM tasks t 
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE t.deleted_at IS NULL
          ORDER BY t.created_at DESC
        `).all();
        return { tasks };
      } catch (error: any) {
        logError('get_tasks', error);
        return { success: false, error: `Failed to retrieve tasks: ${error.message}` };
      }
    },
    get_projects: () => {
      try {
        const projects = db.prepare('SELECT * FROM projects WHERE deleted_at IS NULL').all();
        return { projects };
      } catch (error: any) {
        logError('get_projects', error);
        return { success: false, error: `Failed to retrieve projects: ${error.message}` };
      }
    },
    undo_last_action: () => {
      try {
        const lastLog = db.prepare('SELECT * FROM ai_action_logs ORDER BY timestamp DESC LIMIT 1').get() as any;
        if (!lastLog) return { success: false, error: "No actions found to undo" };

        const details = JSON.parse(lastLog.details);
        const outcome = JSON.parse(lastLog.outcome);

        if (lastLog.action_type === 'create_task') {
          db.prepare('DELETE FROM tasks WHERE id = ?').run(outcome.task_id);
        } else if (lastLog.action_type === 'delete_task') {
          db.prepare('UPDATE tasks SET deleted_at = NULL WHERE id = ?').run(details.task_id);
        } else if (lastLog.action_type === 'create_project') {
          db.prepare('DELETE FROM projects WHERE id = ?').run(outcome.project_id);
        } else if (lastLog.action_type === 'delete_project') {
          db.prepare('UPDATE projects SET deleted_at = NULL WHERE id = ?').run(details.project_id);

          if (outcome.deleted_task_ids && outcome.deleted_task_ids.length > 0) {
            const placeholders = outcome.deleted_task_ids.map(() => '?').join(',');
            db.prepare(`UPDATE tasks SET deleted_at = NULL WHERE id IN (${placeholders})`).run(...outcome.deleted_task_ids);
          }
        } else if (lastLog.action_type === 'log_time') {
          db.prepare('DELETE FROM time_logs WHERE task_id = ? AND hours = ? AND date = ? ORDER BY created_at DESC LIMIT 1').run(details.task_id, details.hours, details.date || new Date().toISOString().split('T')[0]);
        } else {
          return { success: false, error: `Undo functionality for '${lastLog.action_type}' is not yet implemented` };
        }

        db.prepare('DELETE FROM ai_action_logs WHERE id = ?').run(lastLog.id);
        return { success: true, message: `Successfully undid the last ${lastLog.action_type} action` };
      } catch (error: any) {
        logError('undo_last_action', error);
        return { success: false, error: `Failed to undo action: ${error.message}` };
      }
    }
  };

  // --- Rate Limiting Middleware ---
  const requestCounts = new Map<string, { count: number, resetAt: number }>();
  const rateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip;
    const now = Date.now();
    const limit = 20; // 20 requests per minute
    const window = 60000;

    let record = requestCounts.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + window };
    }

    record.count++;
    requestCounts.set(ip, record);

    if (record.count > limit) {
      return res.status(429).json({ error: "Rate limit exceeded. Please wait a minute before trying again." });
    }
    next();
  };

  // --- API Routes ---
  app.get("/api/tasks", (req, res, next) => {
    try {
      const tasks = db.prepare('SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.deleted_at IS NULL').all();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/projects", (req, res, next) => {
    try {
      const projects = db.prepare('SELECT * FROM projects WHERE deleted_at IS NULL').all();
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/projects", (req, res, next) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Project name is required" });
      }

      const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
      const info = stmt.run(name, description);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/projects/:id", (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      if (name !== undefined) { updates.push('name = ?'); values.push(name); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }

      if (updates.length === 0) return res.status(400).json({ error: "No fields provided for update" });

      const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`;
      values.push(id);
      const result = db.prepare(query).run(...values);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/projects/:id", (req, res, next) => {
    try {
      const { id } = req.params;

      const result_db = db.prepare('UPDATE projects SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
      if (result_db.changes === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      db.prepare('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE project_id = ? AND deleted_at IS NULL').run(id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/metrics", (req, res, next) => {
    try {
      const timeResult = db.prepare('SELECT SUM(hours) as totalHours FROM time_logs').get() as { totalHours: number | null };
      const totalHours = timeResult.totalHours || 0;
      res.json({ totalHours });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks", (req, res, next) => {
    try {
      const { title, description, project_id, priority, estimated_hours } = req.body;
      if (!title || project_id === undefined || project_id === null || project_id === 0) {
        return res.status(400).json({ error: "Title and a valid Project ID are required" });
      }

      // Check if project exists and is not deleted
      const projectExists = db.prepare('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL').get(project_id);
      if (!projectExists) {
        return res.status(400).json({ error: "Cannot create task. The assigned project does not exist." });
      }

      const stmt = db.prepare('INSERT INTO tasks (title, description, project_id, priority, estimated_hours) VALUES (?, ?, ?, ?, ?)');
      const info = stmt.run(title, description, project_id, priority, estimated_hours);
      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id", (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, project_id, priority, estimated_hours, status } = req.body;
      const updates: string[] = [];
      const values: any[] = [];
      if (title !== undefined) { updates.push('title = ?'); values.push(title); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (project_id !== undefined) { updates.push('project_id = ?'); values.push(project_id); }
      if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
      if (estimated_hours !== undefined) { updates.push('estimated_hours = ?'); values.push(estimated_hours); }
      if (status !== undefined) { updates.push('status = ?'); values.push(status); }

      if (updates.length === 0) return res.status(400).json({ error: "No fields provided for update" });

      const query = `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      values.push(id);
      const result = db.prepare(query).run(...values);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tasks/:id", (req, res, next) => {
    try {
      const { id } = req.params;
      const result = db.prepare('UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/chat", rateLimit, async (req, res, next) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Gemini API Key is not configured in the environment" });

      const ai = new GoogleGenAI({ apiKey });

      const toolDeclarations = [
        {
          name: "create_task",
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              project_id: { type: Type.INTEGER },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              estimated_hours: { type: Type.NUMBER }
            },
            required: ["title", "project_id"]
          }
        },
        {
          name: "update_task",
          parameters: {
            type: Type.OBJECT,
            properties: {
              task_id: { type: Type.INTEGER },
              status: { type: Type.STRING, enum: ["todo", "in_progress", "done"] },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
              title: { type: Type.STRING }
            },
            required: ["task_id"]
          }
        },
        {
          name: "delete_task",
          parameters: {
            type: Type.OBJECT,
            properties: {
              task_id: { type: Type.INTEGER },
              confirmed: { type: Type.BOOLEAN, description: "Must be true. Only set to true after the user has explicitly confirmed the deletion in chat." }
            },
            required: ["task_id", "confirmed"]
          }
        },
        {
          name: "create_project",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name"]
          }
        },
        {
          name: "update_project",
          parameters: {
            type: Type.OBJECT,
            properties: {
              project_id: { type: Type.INTEGER },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["active", "completed", "archived"] }
            },
            required: ["project_id"]
          }
        },
        {
          name: "delete_project",
          parameters: {
            type: Type.OBJECT,
            properties: {
              project_id: { type: Type.INTEGER },
              confirmed: { type: Type.BOOLEAN, description: "Must be true. Only set to true after the user has explicitly confirmed the deletion of the project and all its tasks." }
            },
            required: ["project_id", "confirmed"]
          }
        },
        {
          name: "log_time",
          parameters: {
            type: Type.OBJECT,
            properties: {
              task_id: { type: Type.INTEGER },
              hours: { type: Type.NUMBER },
              date: { type: Type.STRING }
            },
            required: ["task_id", "hours"]
          }
        },
        {
          name: "get_tasks",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "get_projects",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "undo_last_action",
          parameters: { type: Type.OBJECT, properties: {} }
        }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: `You are the Work Intelligence Agent. 
          You have access to tools to manage tasks, projects, and time logs.
          
          SAFETY & AUDIT RULES:
          1. Always use tools to fetch data before answering questions about tasks or projects.
          2. MANDATORY CONFIRMATION: For destructive operations (delete_task, delete_project), you MUST ask the user for explicit confirmation first. 
             - First, explain what will be deleted.
             - Wait for the user to say "yes", "confirm", or similar.
             - ONLY THEN call the tool with confirmed=true.
             - The confirmation is logged automatically when you call the tool with the confirmed parameter.
          3. UNDO: If a user wants to revert an action, use the undo_last_action tool.
          4. No Fabricated IDs: Never guess or make up task IDs. Always fetch them using get_tasks.
          5. Professional Tone: Maintain a professional, helpful tone. Frame performance insights in business value terms.
          
          Current projects available: use get_projects to find out.`,
          tools: [{ functionDeclarations: toolDeclarations }]
        }
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];

      if (part?.functionCall) {
        const { name, args } = part.functionCall;
        const toolResult = (tools as any)[name](args);

        // Send tool result back to model for final response
        const secondResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [
            { role: "user", parts: [{ text: message }] },
            { role: "model", parts: [{ functionCall: part.functionCall }] },
            { role: "user", parts: [{ functionResponse: { name, response: toolResult } }] }
          ],
          config: { tools: [{ functionDeclarations: toolDeclarations }] }
        });

        res.json({ text: secondResponse.text });
      } else {
        res.json({ text: response.text });
      }
    } catch (error: any) {
      logError('chat_api', error);
      res.status(500).json({ error: "An internal error occurred while processing your request." });
    }
  });

  // --- Global Error Handler ---
  app.use((err: any, req: any, res: any, next: any) => {
    logError('global_handler', err);
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === 'production' ? "Something went wrong" : err.message
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
