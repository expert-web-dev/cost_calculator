import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovingCalculator } from "@/components/MovingCalculator";
import { ImageGallery } from "@/components/ImageGallery";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroSection />
        <MovingCalculator />
        <ImageGallery />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
