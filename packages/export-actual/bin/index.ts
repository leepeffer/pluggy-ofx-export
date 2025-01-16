import "dotenv/config";
import { updateActualBudget } from "../lib";

await updateActualBudget({ maxRetries: 3 });
