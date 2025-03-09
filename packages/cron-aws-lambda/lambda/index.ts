import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { updateActualBudget } from "@pluggy-actual-export/export-actual";

const app = new Hono();

app.get('/', async (c) => {
  await updateActualBudget();
  return c.json({ message: 'Imported items successfully.' });
});

export const handler = handle(app);
