import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { updateActualBudget } from "@pluggy-actual-export/actual";

const app = new Hono();

app.get('/', async (c) => {
  await updateActualBudget();
  c.json({ message: 'Imported!' });
});

export const handler = handle(app);
