Deployment Architecture
Frontend & API: Vercel (Hobby plan). Environment variables: OPENAI_API_KEY, DATABASE_URL.

Database: Neon.tech (free tier). Run migrations manually via psql or a script.

No caching, no queues, no blob storage.




Security & Operational Considerations
OpenAI costs: Set MAX_TOKENS_PER_DAY environment variable; middleware rejects requests after limit (simple counter in memory – resets daily).

Rate limiting: Not implemented in V1; assume single user.

Error handling: API returns 500 with user‑friendly message; logs to Vercel console.

Data isolation: Hardcoded user_id. Future multi‑user only requires replacing the default value with session user.

