'use client'
import HeroSection from './components/HeroSection'
import BenefitCards from './components/BenefitCards'
import FeaturesGrid from './components/FeaturesGrid'
import TrustStrip from './components/TrustStrip'
import QuickDemo from './components/QuickDemo'
import FooterBar from './components/FooterBar'
import WrongQuestionPanel from './components/WrongQuestionPanel'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header>
        <HeroSection />
      </header>
      <main className="flex-1">
        <BenefitCards />
        <TrustStrip />
        <QuickDemo />
        <FeaturesGrid />
      </main>
      <FooterBar />
    </div>
  )
}
