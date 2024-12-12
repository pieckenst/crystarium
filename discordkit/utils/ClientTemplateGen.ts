import { Effect } from "effect";
import { HarmonixOptions, Harmonix } from "../types/harmonixtypes";
import Eris, { Constants } from "eris";
import { logDebug, logError, logInfo } from "./centralloggingfactory";
import knex, { Knex } from "knex";
import { resolve } from "path";
import { readFileSync } from "fs";
import dotenv from "dotenv";

export class ClientTemplate {
  // Database connection instance
  private static dbConnection: Knex | null = null;
  // Cache for table schemas
  private static tableCache = new Map<string, any>();

  /**
   * Loads the configuration from a specified file path.
   * @param configPath - The path to the configuration file.
   * @returns A promise that resolves to the HarmonixOptions.
   */
  static loadConfig(configPath: string): Effect.Effect<HarmonixOptions, Error, never> {
    logDebug("Loading config from path:", configPath);
    return Effect.tryPromise({
      try: async () => {
        const configFile = readFileSync(resolve(process.cwd(), configPath), "utf-8");
        const config: HarmonixOptions = JSON.parse(configFile);

        if (config.debug) {
          logDebug("Loaded config:", config);
        }

        return config;
      },
      catch: (error: unknown) => {
        logError("Failed to load config:", error as Error);
        return new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Loads the token from the environment variables.
   * @returns An Effect that resolves to the token string.
   */
  static loadToken(): Effect.Effect<string, Error, never> {
    logDebug("Loading token from environment variables");
    return Effect.tryPromise({
      try: async () => {
        dotenv.config();
        const token = process.env.token;
        if (!token) throw new Error("Token not found in .env");
        logDebug("Token loaded successfully");
        return token;
      },
      catch: (error: unknown) => {
        logError("Failed to load token:", error as Error);
        return new Error(`Failed to load token: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  /**
   * Initializes the database connection based on the provided options.
   * @param options - The HarmonixOptions containing database configuration.
   * @returns A promise that resolves to a Knex instance or null.
   */
  static async initDatabase(options: HarmonixOptions): Promise<Knex | null> {
    logDebug("Initializing database with options:", options);
    if (!options.featureFlags?.useDatabase || options.featureFlags.useDatabase === "none") {
      logDebug("Database usage is disabled");
      return null;
    }

    // Database configuration for different database types
    const dbConfig: Record<string, any> = {
      sqlite: {
        client: "sqlite3",
        connection: { filename: "./data/bot.sqlite" },
        useNullAsDefault: true
      },
      postgres: {
        client: "pg",
        connection: {
          host: process.env.DB_HOST || "localhost",
          database: process.env.DB_NAME || "harmonix",
          user: process.env.DB_USER || "postgres",
          password: process.env.DB_PASSWORD
        }
      },
      mssql: {
        client: "mssql",
        connection: {
          server: process.env.DB_HOST || "localhost",
          database: process.env.DB_NAME || "harmonix",
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD
        }
      }
    };

    const selectedDb = dbConfig[options.featureFlags.useDatabase];
    if (!selectedDb) {
      logDebug("No valid database configuration found");
      return null;
    }

    try {
      const db = knex(selectedDb);
      logDebug("Database connection established");
      await this.initTables(db);
      this.dbConnection = db;
      logDebug("Database initialized successfully");
      return db;
    } catch (error) {
      logError("Database initialization failed:", error as Error);
      throw error;
    }
  }

  /**
   * Initializes the necessary tables in the database.
   * @param db - The Knex instance for database operations.
   */
  private static async initTables(db: Knex): Promise<void> {
    logDebug("Initializing database tables");
    // Table schemas for the application
    const tables = {
      guilds: (table: Knex.CreateTableBuilder) => {
        table.string("id").primary();
        table.string("prefix");
        table.json("settings");
        table.timestamps(true, true);
      },
      users: (table: Knex.CreateTableBuilder) => {
        table.string("id").primary();
        table.integer("experience").defaultTo(0);
        table.json("settings");
        table.timestamps(true, true);
      },
      music_queues: (table: Knex.CreateTableBuilder) => {
        table.string("guild_id");
        table.json("queue");
        table.timestamps(true, true);
      },
      moderation_logs: (table: Knex.CreateTableBuilder) => {
        table.increments("id");
        table.string("guild_id");
        table.string("user_id");
        table.string("moderator_id");
        table.string("action");
        table.text("reason");
        table.timestamps(true, true);
      }
    };

    // Create tables if they do not exist
    for (const [tableName, schema] of Object.entries(tables)) {
      if (!(await db.schema.hasTable(tableName))) {
        logDebug(`Creating table: ${tableName}`);
        await db.schema.createTable(tableName, schema);
      } else {
        logDebug(`Table already exists: ${tableName}`);
      }
    }
    logDebug("All tables initialized successfully");
  }

  /**
   * Defines the client configuration and build process.
   * @param options - The HarmonixOptions for client configuration.
   * @returns An object containing client configuration and build function.
   */
  static define(options: HarmonixOptions) {
    
    return {
      intents: options.intents || [
        "guilds",
        "guildMessages",
        "guildVoiceStates",
        "messageContent"
      ],
      token: options.token,
      prefix: options.prefix,
      debug: options.debug,
      featureFlags: options.featureFlags,
      dirs: options.dirs,
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      host: options.host,
      port: options.port,
      password: options.password,
      ownerId: options.ownerId,

      /**
       * Builds the Harmonix client with the specified options.
       * @returns A generator function that yields the Harmonix instance.
       */
      build: Effect.gen(function* (_) {
        if (options.debug) {
          logDebug("Building client with options:", options);
        }

        // Initialize the Eris client
        const client = new Eris.Client(options.token, {
          intents: options.intents?.map(intent => 
            Constants.Intents[intent as keyof typeof Constants.Intents]
          ) || [],
          restMode: true,
          maxShards: "auto",
          allowedMentions: {
            everyone: false,
            roles: false,
            users: true
          }
        });
        logDebug("Eris client initialized");

        // Initialize the database
        const db = yield* _(Effect.tryPromise(() => 
          ClientTemplate.initDatabase(options)
        ));
        logDebug("Database initialized");

        // Create the Harmonix instance
        const harmonix: Harmonix = {
          client,
          options: {
            ...options,
            database: db
          },
          commands: new Eris.Collection(),
          slashCommands: new Eris.Collection(),
          events: new Eris.Collection(),
          startTime: new Date(),
          manager: {} as any // Deferred
        };

        if (options.debug) {
          logDebug("Client built successfully");
        }

        return harmonix;
      })
    };
  }
}
