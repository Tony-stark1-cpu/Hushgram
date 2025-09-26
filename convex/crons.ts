import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up offline users every 5 minutes
crons.interval("cleanup offline users", { minutes: 5 }, internal.users.cleanupOfflineUsers, {});

export default crons;
