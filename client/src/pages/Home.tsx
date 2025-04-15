import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovingCalculator } from "@/components/MovingCalculator";
import { ImageGallery } from "@/components/ImageGallery";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          <Tabs defaultValue="calculator" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="calculator">Moving Calculator</TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <HeroSection />
              <MovingCalculator />
            </TabsContent>
            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <HeroSection />
            <MovingCalculator />
          </>
        )}
        <ImageGallery />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
