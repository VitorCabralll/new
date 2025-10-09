// backend/test/setup.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the .env file in the 'backend' directory
config({ path: resolve(__dirname, '..', '.env') });