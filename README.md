# 🤫 WorkWhisper

**India's anonymous professional community for salary transparency and workplace discussions.**

Built with Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Pusher · OpenAI

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/yourorg/workwhisper
cd workwhisper
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Database
```bash
# Create PostgreSQL database (Neon/Supabase recommended)
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with 50 realistic posts
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🏗️ Full Project Structure

```
workwhisper/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── seed.ts                # 50 realistic Indian posts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx       # OTP login UI
│   │   ├── (main)/
│   │   │   ├── page.tsx             # Homepage + hero
│   │   │   ├── feed/page.tsx        # Feed page
│   │   │   ├── bowls/page.tsx       # Bowl listing
│   │   │   ├── bowl/[slug]/page.tsx # Bowl detail
│   │   │   ├── post/
│   │   │   │   ├── [id]/page.tsx    # Post detail
│   │   │   │   └── new/page.tsx     # Create post
│   │   │   ├── profile/page.tsx     # Anonymous profile
│   │   │   ├── company/[slug]/      # SEO company page
│   │   │   └── salary/[role]/       # SEO salary page
│   │   ├── api/
│   │   │   ├── auth/               # NextAuth + OTP
│   │   │   ├── feed/               # Paginated feed
│   │   │   ├── posts/              # CRUD + vote
│   │   │   ├── bowls/              # Bowl CRUD + join
│   │   │   ├── ai/insights/        # AI salary/trending
│   │   │   └── sitemap/            # Dynamic XML sitemap
│   │   ├── globals.css             # Design system CSS
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── auth/                   # Login components
│   │   ├── bowl/                   # Bowl header, join btn
│   │   ├── feed/                   # PostCard, InfiniteScroll, Filters
│   │   ├── layout/                 # Header, MainLayout, Sidebar
│   │   ├── post/                   # CreateForm, Detail, Comments
│   │   └── ui/                     # Avatar, Toaster
│   ├── lib/
│   │   ├── ai/moderation.ts        # OpenAI moderation + insights
│   │   ├── auth/options.ts         # NextAuth config
│   │   ├── auth/utils.ts           # OTP, username gen, email
│   │   ├── prisma/client.ts        # Prisma singleton
│   │   ├── realtime/pusher.ts      # Pusher server + client
│   │   └── utils/index.ts          # Helpers
│   ├── middleware.ts               # Auth middleware
│   └── types/                      # TypeScript types
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🌍 Deployment (Vercel + Neon)

### Database — Neon (Recommended)
1. Create project at https://neon.tech
2. Copy connection string → `DATABASE_URL` in `.env`
3. Run `npm run db:migrate`

### Realtime — Pusher
1. Create app at https://pusher.com
2. Copy credentials → `.env`
3. Choose cluster `ap2` (Mumbai) for India latency

### Email — Gmail SMTP
1. Enable 2FA on Gmail
2. Generate App Password → `SMTP_PASS`
3. Set `SMTP_USER` to your Gmail

### OpenAI
1. Get API key from https://platform.openai.com
2. Set `OPENAI_API_KEY` in `.env`

### Vercel Deploy
```bash
npm i -g vercel
vercel
# Follow prompts, set all env vars in Vercel dashboard
```

Or connect GitHub repo to Vercel for auto-deploys.

---

## 📈 Launch Strategy

### Phase 1 — Foundation (Week 1-2)
Focus on these 3 bowls first:
1. **Software Engineers India** — largest addressable audience
2. **Salary Discussions** — highest virality potential
3. **TCS Employees** — ~600K employees, huge captive audience

### Phase 2 — Seeding Content
- Manually seed 50 realistic salary posts across companies
- Write 20 discussion posts on hot topics (RTO, hikes, layoffs)
- Respond to every post in first 2 weeks

### Phase 3 — Growth Channels

**Reddit:**
- Post insights (anonymized) to r/cscareerquestionsIN, r/india, r/bangalore
- Don't spam — add value first, mention WorkWhisper naturally

**LinkedIn:**
- Share salary insights as anonymous data ("WorkWhisper users report...")
- Target: #WorkLifeBalance, #IndianTechIndustry, #SalaryTransparency

**Twitter/X:**
- Thread format: "We anonymously surveyed 100 Indian software engineers. Here's what they make at TCS vs Google..."

### Phase 4 — SEO
- `/company/[slug]` pages index fast for "[Company] salary India" queries
- `/salary/[role]` pages target "[Role] salary India" — high intent
- Generate 50+ company and role pages from seed data

---

## 💰 Monetization Roadmap

### Immediate (Month 1-3)
- Google AdSense on feed and company pages
- Non-intrusive banner placements (already stubbed as `<AdPlaceholder>`)

### Medium Term (Month 3-6)
- **Premium membership** (₹199/month): Unlimited bowls, salary filters, export data
- **Salary Report PDF**: Downloadable detailed reports per role/company

### Long Term (6+ months)
- **Recruiter Access**: Anonymized talent pool insights
- **Company Insights Dashboard**: Employers pay to see sentiment analytics

---

## 🔒 Privacy & Security

- Emails hashed before storage; never linked to posts publicly
- OTP tokens hashed with SHA-256
- Anonymous usernames randomly generated at signup
- No real-name association anywhere in DB
- Content moderated by OpenAI + PII detection
- All personal data deletable on request

---

## 🛠️ Extending WorkWhisper

### Add SMS OTP
Replace the SMS placeholder in `src/lib/auth/utils.ts` with Twilio/MSG91:
```typescript
import twilio from "twilio";
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
await client.messages.create({ to: phone, from: process.env.TWILIO_FROM, body: `Your WorkWhisper code: ${otp}` });
```

### Add More Bowls
```bash
# Edit prisma/seed.ts and add to bowls array, then:
npm run db:seed
```

### Custom Domain
Set `NEXT_PUBLIC_APP_URL=https://workwhisper.in` and configure DNS in Vercel.

---

## 📊 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth v4 + OTP |
| Realtime | Pusher |
| AI | OpenAI GPT-3.5 + Moderation |
| Deployment | Vercel |
| Email | Nodemailer (SMTP) |

---

Built with ❤️ for the Indian professional community.
