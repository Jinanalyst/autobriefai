"use client";

import { Pricing, PricingPlan } from "@/components/blocks/pricing";

const demoPlans: PricingPlan[] = [
  {
    name: "STARTER",
    tier: 'starter',
    price: "Free",
    period: "per month",
    features: [
      "Up to 5 summaries",
      "Basic analytics",
      "Community support",
    ],
    description: "Perfect for individuals and small projects",
    buttonText: "Get Started",
    href: "/demo",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    tier: 'professional',
    price: "0.5",
    period: "One-time payment",
    features: [
      "Unlimited summaries",
      "Advanced analytics",
      "Team collaboration features",
      "Integration with Notion and Slack",
      "PDF report export",
      "Priority support",
    ],
    description: "Ideal for growing teams and businesses",
    buttonText: "Purchase",
    href: "/payment?plan=professional&amount=0.5",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    tier: 'enterprise',
    price: "1",
    period: "One-time payment",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Advanced security features",
      "Internal API integration",
      "On-premise hosting option",
      "SLA agreement",
    ],
    description: "For large organizations with specific needs",
    buttonText: "Purchase",
    href: "/payment?plan=enterprise&amount=1",
    isPopular: false,
  },
];

export default function PricingPage() {
  return (
    <Pricing 
      plans={demoPlans}
      title="Unlock the Power of AI Summarization"
      description={`Pay with SOL and get instant access.
Choose the plan that fits your needs.`}
    />
  );
} 