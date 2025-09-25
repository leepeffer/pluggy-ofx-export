# Research: Cron Job on Render.com

## Decision: Use Render Cron Jobs

-   **Decision**: We will use Render's built-in Cron Jobs feature.
-   **Rationale**: It's the native way to run scheduled tasks on Render. It's simple to configure and integrates well with the existing environment.
-   **Alternatives considered**:
    -   Using a third-party cron job service: This would add unnecessary complexity and cost.
    -   Running a long-running process with a scheduler library (e.g., `node-cron`): This is less reliable than Render's native cron jobs and harder to manage.

## Decision: Default Cron Schedule

-   **Decision**: The default cron schedule will be "daily at midnight UTC".
-   **Rationale**: This is a reasonable default for a daily sync. It can be configured via an environment variable.
-   **Alternatives considered**:
    -   Every hour: This might be too frequent and could hit API rate limits.
    -   Every 12 hours: A good alternative, but daily is a simpler starting point.

## How to set up on Render.com

1.  Create a new "Cron Job" service on Render.
2.  Connect the GitHub repository.
3.  Set the build command (e.g., `npm install && npm run build`).
4.  Set the cron command (e.g., `npm run sync`).
5.  Set the cron schedule (e.g., `0 0 * * *`).
6.  Add the required environment variables in the "Environment" tab.