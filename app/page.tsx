'use client'

import { useRouter } from 'next/navigation'
import { Upload, FileText, Video, File, BrainCircuit, Mail, CalendarClock, Zap } from 'lucide-react'
import Header from '@/components/Header'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

const features = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-primary-600" />,
    title: 'Meeting Summary',
    description: 'Upload Zoom or Google Meet recordings → convert to text → summarize key points and action items.',
  },
  {
    icon: <FileText className="w-8 h-8 text-primary-600" />,
    title: 'Document Summary',
    description: 'Upload docx/pdf documents → extract key insights and highlights.',
  },
  {
    icon: <Mail className="w-8 h-8 text-primary-600" />,
    title: 'Email Summary',
    description: 'Connect team email inbox → summarize long email threads.',
  },
  {
    icon: <CalendarClock className="w-8 h-8 text-primary-600" />,
    title: 'Auto Weekly Report',
    description: 'Automatically send weekly team report every Friday (PDF or Notion).',
  },
  {
    icon: <Zap className="w-8 h-8 text-primary-600" />,
    title: 'Slack/Notion Integration',
    description: 'Seamlessly share summaries via Slack or Notion.',
  },
  {
    icon: <Upload className="w-8 h-8 text-primary-600" />,
    title: 'More to Come',
    description: 'We are constantly adding new features and integrations.',
  },
]

const logos = [
  { name: 'Protocol Labs', src: '/logo-protocol-labs.svg' },
  { name: 'Algorand', src: '/logo-algorand.svg' },
  { name: 'Okta', src: '/logo-okta.svg' },
  { name: 'Stripe', src: '/logo-stripe.svg' },
  { name: 'Amazon Web Services', src: '/logo-aws.svg' },
  { name: 'Google Cloud', src: '/logo-google-cloud.svg' },
]

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4">
        <section className="text-center py-20 sm:py-32">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Instant AI Summaries for Your Business
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AutoBrief.AI transforms your long meetings, documents, and presentations into clear, actionable insights in seconds.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/demo" className={buttonVariants({ size: 'lg' })}>
              Get Started for Free
            </Link>
            <Link href="/pricing" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              View Pricing
            </Link>
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-center text-sm font-semibold text-gray-600 tracking-wider">
            TRUSTED BY TEAMS AT THE WORLD'S BEST COMPANIES
          </h2>
          <div className="mt-8 flow-root">
            <div className="-mt-4 -ml-8 flex flex-wrap justify-center lg:-ml-4">
              {logos.map((logo) => (
                <div key={logo.name} className="mt-4 ml-8 flex flex-grow flex-shrink-0 items-center justify-center lg:ml-4 lg:flex-grow-0">
                  <img className="h-12" src={logo.src} alt={logo.name} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Core Features for Your Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                AutoBrief.AI provides a powerful suite of tools to boost productivity and clarity.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Link href="/demo" key={index}>
                  <div className="card text-left h-full hover:shadow-lg transition-shadow duration-300">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 