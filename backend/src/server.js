import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { currentUser } from './middleware/currentUser.js';
import { employeesRouter } from './routes/employees.js';
import { reviewsRouter } from './routes/reviews.js';
import { adminRouter } from './routes/admin.js';
import { notificationsRouter } from './routes/notifications.js';
import { ApiError } from './errors.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', currentUser, employeesRouter, reviewsRouter, adminRouter, notificationsRouter);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'RESOURCE_NOT_FOUND', message: `No route for ${req.path}.` } });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'This review already has a reply.' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected error.' } });
});

app.listen(config.port, () => {
  console.log(`pulse-feedback-api listening on http://127.0.0.1:${config.port}`);
});
