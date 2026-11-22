# 🍕 PizzaHub — Modern Food Ordering & Restaurant Management Platform

PizzaHub is a full-stack food ordering and restaurant management platform designed to connect customers with food vendors through a seamless digital experience.

The platform provides customers with an intuitive way to explore menus, vendors with tools to manage their restaurant menus, and administrators with centralized control over users, menu approvals, and subscription transactions.

Built with modern web technologies, PizzaHub focuses on scalability, role-based access control, secure authentication, and a responsive user experience.

---

## 🌐 Live Demo

- **Live Website:** https://pizzahub-client-six.vercel.app
- **Backend API:** https://pizzahub-server-aazy.onrender.com
- **Client Repository:** https://github.com/Amdad09/pizzahub-client
- **Server Repository:** https://github.com/Amdad09/pizzahub-server

---

## ✨ Key Features

### 👤 Customer

- Browse available food items and restaurant menus.
- Explore approved and active menu items.
- View food details and pricing.
- Access a responsive and user-friendly interface.
- Place food orders through the ordering workflow.
- Manage customer account information.

### 🏪 Vendor

- Access a dedicated vendor dashboard.
- Create, update, and manage menu items.
- Submit menu items for administrator approval.
- Track menu approval status.
- View rejection information when applicable.
- Manage restaurant menu availability.
- Subscribe to the Premium plan.
- Access subscription-related information.

### 🛡️ Administrator

- Access a centralized admin dashboard.
- View platform overview and statistics.
- Manage registered users.
- Block or unblock users.
- Review submitted menu items.
- Approve or reject menu submissions.
- Manage menu item statuses.
- View vendor subscription payment transactions.
- Monitor transaction amounts, payment statuses, and dates.

### 💳 Subscription & Payment

- Stripe Checkout integration for vendor subscriptions.
- Recurring Premium subscription support.
- Stripe webhook integration for payment event processing.
- Subscription status synchronization through verified webhook events.
- Transaction records for subscription payments.

**Note:** Stripe is used for vendor subscription billing. Customer food ordering is handled separately from vendor subscription payments.

### 🎨 User Experience

- Responsive design for different screen sizes.
- Light and dark theme support.
- Modern dashboard layouts.
- Interactive UI components.
- Loading, error, and empty states.
- Consistent visual design across application sections.

---

## 🧰 Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Better Auth Client
- Lucide React

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB Native Driver
- Better Auth
- Zod

### Payment Integration

- Stripe Checkout
- Stripe Webhooks
- Stripe Subscription Billing

### Development Tools

- Git & GitHub
- npm
- Stripe CLI

---

## 🏗️ Project Architecture

PizzaHub follows a separated client-server architecture.

```text
PizzaHub/
│
├── pizzahub-client/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── config/
│   ├── public/
│   └── package.json
│
└── pizzahub-server/
    ├── src/
    │   ├── modules/
    │   ├── database/
    │   ├── middlewares/
    │   ├── config/
    │   └── server.ts
    ├── package.json
    └── tsconfig.json
```

The frontend and backend are maintained in separate repositories to support independent development and deployment.

---

## ⚙️ Getting Started

Follow these instructions to run PizzaHub locally.

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB database
- Git
- Stripe account (for subscription payment testing)
- Stripe CLI (for local webhook testing)

### 1. Clone the Repositories

```bash
git clone https://github.com/Amdad09/pizzahub-client
git clone https://github.com/Amdad09/pizzahub-server
```

Open the client and server directories separately.

### 2. Set Up the Backend

```bash
cd pizzahub-server
npm install
```

Create a `.env` file in the server root directory.

Configure the required environment variables using the provided `.env.example` file.

At minimum, the Stripe-related configuration includes:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PREMIUM_PRICE_ID=your_recurring_price_id
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
```

Add the remaining database, authentication, application URL, and other required configuration values according to the backend `.env.example`.

Start the development server:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

### 3. Set Up the Frontend

Open another terminal:

```bash
cd pizzahub-client
npm install
```

Create a `.env.local` file and configure the required frontend environment variables according to the frontend `.env.example`.

Start the development server:

```bash
npm run dev
```

The frontend runs locally on:

```text
http://localhost:3000
```

### 4. Configure Stripe Webhooks (Local Development)

To receive Stripe subscription events locally, authenticate the Stripe CLI:

```bash
stripe login
```

Start the webhook listener:

```bash
stripe listen --events checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed --forward-to localhost:5000/api/v1/subscriptions/webhook
```

Copy the generated webhook signing secret and configure it as `STRIPE_WEBHOOK_SECRET` in the backend environment file.

Restart the backend after updating the environment variable.

---

## 🔐 Authentication & Authorization

PizzaHub uses Better Auth for authentication and role-based access control.

The platform supports three primary roles:

| Role | Access |
|---|---|
| Customer | Customer-facing features |
| Vendor | Vendor dashboard and menu management |
| Admin | Administrative management and monitoring |

Protected resources are restricted according to user roles and applicable authorization rules.

---

## 💰 Vendor Subscription Model

PizzaHub provides a Premium subscription option for vendors.

| Feature | Free Plan | Premium Plan |
|---|---|---|
| Active menu items | Up to 3 | Unlimited |
| Menu management | Yes | Yes |
| Subscription billing | Not required | Stripe |
| Premium access | No | Yes |

Premium access is managed through the subscription workflow and verified Stripe webhook events.

---

## 📡 API

The backend exposes RESTful API endpoints under:

```text
/api/v1
```

Major API modules include:

- Authentication
- Users
- Menu
- Admin
- Subscriptions
- Orders

For detailed endpoint documentation, refer to the backend repository.

---

## 🚀 Deployment

The client and server are designed for independent deployment.

Suggested deployment configuration:

| Application | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Payment Gateway | Stripe |

For production deployment:

1. Configure production environment variables.
2. Deploy the backend and frontend separately.
3. Configure the frontend API base URL.
4. Configure the production Stripe webhook endpoint.
5. Add the production webhook signing secret to the backend environment.
6. Verify authentication, subscription, and payment workflows.

---

## 🔒 Security Notes

- Never commit `.env` or `.env.local` files.
- Never expose Stripe secret keys in frontend code.
- Keep webhook signing secrets private.
- Validate incoming request data.
- Apply authentication and authorization to protected endpoints.
- Verify Stripe webhook signatures before processing events.

---

## 🧪 Quality Checks

Run the available project checks before submitting changes.

```bash
npm run typecheck
npm run lint
```

Run these commands inside the respective client or server repository where the scripts are available.

---

## 🎯 Project Goals

PizzaHub was developed to demonstrate practical full-stack engineering skills, including:

- Modern frontend development.
- REST API development.
- Database integration.
- Authentication and role-based authorization.
- Payment gateway integration.
- Webhook-based event processing.
- Dashboard and administrative workflows.
- Maintainable client-server architecture.
- Responsive UI development.

---

## 👨‍💻 Author

**Amdadul Haque**

Full-Stack Developer

- GitHub: https://github.com/Amdad09
- LinkedIn: https://www.linkedin.com/in/Amdad09
- Portfolio: https://portfolio1-lime-nine-11.vercel.app
- Email: amdadulhaque601671@gmail.com

---

<p align="center">
  Built with ❤️ using modern web technologies.
</p>

<p align="center">
  <strong>PizzaHub — Bringing Food & Technology Together.</strong>
</p>