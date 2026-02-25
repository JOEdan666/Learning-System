'use client'
import dynamic from 'next/dynamic'
import HeroSection from './components/HeroSection'

const QuickStart = dynamic(() => import('./components/QuickStart'))
const FeaturesGrid = dynamic(() => import('./components/FeaturesGrid'))

export default function Home() {
  return (
    <>
      <HeroSection />
      <QuickStart />
      <FeaturesGrid />
    </>
  )
}
