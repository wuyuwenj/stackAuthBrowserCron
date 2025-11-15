# Browser Automation Platform

AI-powered browser automation platform built with Next.js and Browser Use Cloud. Schedule and run web automation tasks using natural language.

## Features

- **AI-Powered Automation**: Define browser tasks in natural language
- **Scheduled Tasks**: Set up cron schedules for recurring automation
- **Task Management**: Create, view, and monitor automation tasks
- **Run History**: Track task execution with logs and results
- **Browser Use Integration**: Powered by Browser Use Cloud API

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Prisma** - Database ORM with PostgreSQL
- **Browser Use SDK** - AI browser automation
- **Tailwind CSS** - Styling
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Prisma Postgres)
- Browser Use Cloud API key ([Get one here](https://cloud.browser-use.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/browser-automation-platform.git
   cd browser-automation-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `BROWSER_USE_API_KEY` - Your Browser Use Cloud API key
   - `CRON_SECRET` - Secret for securing cron endpoint (optional)

4. **Start the database**
   ```bash
   npx prisma dev
   ```
   Or use your own PostgreSQL instance

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Task

1. Navigate to **Create New Task**
2. Fill in the task details:
   - **Task Name**: Descriptive name for your task
   - **Description**: Natural language instructions (e.g., "Log into Stripe and download all invoices from last month")
   - **Target Site**: The website domain (e.g., "stripe", "amazon")
   - **Cron Schedule**: Optional cron expression for scheduling (e.g., `0 9 * * MON` for every Monday at 9am)
3. Click **Create Task**

### Running Tasks

- **Manual Run**: Click "Run Now" on any task detail page
- **Scheduled Run**: Tasks with cron schedules run automatically

### Monitoring

- View all tasks on the **Tasks** page
- Click any task to see run history, logs, and results
- Check task status (Active/Inactive)

## Scheduling

Set up automated task execution using GitHub Actions (recommended) or Vercel Cron.

### GitHub Actions (Recommended - Free & Flexible)

GitHub Actions is already configured in `.github/workflows/cron.yml` to run every 10 minutes.

**Setup Steps:**

1. **Deploy your app to Vercel** (or any platform)

2. **Add GitHub Secrets** to your repository:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add two secrets:
     - `VERCEL_URL`: Your deployed app URL (e.g., `https://browser-cron.vercel.app`)
     - `CRON_SECRET`: Your CRON_SECRET from `.env` (same value)

3. **Enable GitHub Actions**:
   - The workflow is already in `.github/workflows/cron.yml`
   - It will automatically run every 10 minutes
   - You can also trigger it manually from the Actions tab

4. **Customize schedule** (optional):
   - Edit `.github/workflows/cron.yml`
   - Change the cron expression:
     - `*/10 * * * *` - Every 10 minutes (default)
     - `*/5 * * * *` - Every 5 minutes
     - `0 * * * *` - Every hour
     - `0 9 * * *` - Daily at 9am UTC

**Benefits:**
- ✅ Free (2000 minutes/month)
- ✅ Run as frequently as every 5 minutes
- ✅ Unlimited workflows
- ✅ Easy monitoring in Actions tab

### Vercel Cron (Alternative)

**Note**: Vercel Free tier only allows 2 cron jobs max and once per day execution.

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/run-due-tasks",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## API Routes

- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task
- `POST /api/tasks/[id]/run` - Manually run a task
- `POST /api/run-due-tasks` - Run all due scheduled tasks (Vercel Cron)
- `GET /api/run-due-tasks` - Run all due scheduled tasks (GitHub Actions)

## Example Cron Expressions

- `0 9 * * *` - Every day at 9:00 AM
- `0 9 * * MON` - Every Monday at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 */6 * * *` - Every 6 hours

## Project Structure

```
browser-automation-platform/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── tasks/             # Task pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   └── lib/
│       ├── db.ts              # Prisma client
│       ├── browserUse.ts      # Browser Use integration
│       └── cronUtils.ts       # Cron helper functions
├── .env                       # Environment variables
└── package.json
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## Browser Use Examples

Example task descriptions:

- "Log into Stripe dashboard, navigate to invoices, and download all PDFs from the last month"
- "Go to Amazon orders page and check the status of my most recent order"
- "Visit LinkedIn and export my connections list"
- "Monitor the price of [product] on [e-commerce site] and save a screenshot"

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Support

For issues or questions:
- Browser Use docs: https://docs.cloud.browser-use.com
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
