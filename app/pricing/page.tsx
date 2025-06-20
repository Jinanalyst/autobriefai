"use client";

import { Pricing, PricingPlan } from "@/components/blocks/pricing";

const demoPlans: PricingPlan[] = [
  {
    name: "STARTER",
    tier: 'starter',
    price: "Free",
    yearlyPrice: "0",
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
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Unlimited summaries",
      "Advanced analytics",
      "Priority support",
      "Team collaboration",
      "Custom integrations",
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
    yearlyPrice: "0",
    period: "per month",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Advanced security",
      "Custom contracts",
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
      title="Simple, Transparent Pricing"
      description={`Choose the plan that works for you.
All plans include access to our platform, lead generation tools, and dedicated support.`}
    />
  );
} 