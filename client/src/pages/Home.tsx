import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovingCalculator } from "@/components/MovingCalculator";
import { MovingChecklist } from "@/components/MovingChecklist";
import { ImageGallery } from "@/components/ImageGallery";
import { Testimonials } from "@/components/Testimonials";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { UserProfile } from "@/components/UserProfile";
import { StressReliefGame } from "@/components/StressReliefGame";
import { MovingCostHeatmap } from "@/components/MovingCostHeatmap";
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
              <TabsTrigger value="heatmap">Cost Heatmap</TabsTrigger>
              <TabsTrigger value="checklist">Moving Checklist</TabsTrigger>
              <TabsTrigger value="stress-relief">Stress Relief</TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <HeroSection />
              <MovingCalculator />
            </TabsContent>
            <TabsContent value="heatmap">
              <div className="my-8">
                <h2 className="text-3xl font-bold text-center mb-8">Interactive Moving Cost Heatmap</h2>
                <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8">
                  Visualize how moving costs vary across the United States with our interactive heatmap. Select origin cities, home sizes, and view costs for DIY, hybrid, or full-service moves.
                </p>
                <MovingCostHeatmap />
              </div>
            </TabsContent>
            <TabsContent value="checklist">
              <div className="max-w-4xl mx-auto my-8">
                <h2 className="text-3xl font-bold text-center mb-8">Moving Checklist & Timeline</h2>
                <MovingChecklist />
              </div>
            </TabsContent>
            <TabsContent value="stress-relief">
              <div className="max-w-4xl mx-auto my-8">
                <StressReliefGame />
              </div>
            </TabsContent>
            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <HeroSection />
            <MovingCalculator />
            <div className="mb-16 mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">Interactive Moving Cost Heatmap</h2>
              <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8">
                Visualize how moving costs vary across the United States with our interactive heatmap. Select origin cities, home sizes, and view costs for DIY, hybrid, or full-service moves.
              </p>
              <MovingCostHeatmap />
            </div>
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
