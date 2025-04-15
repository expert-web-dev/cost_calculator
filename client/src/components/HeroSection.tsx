import { Button } from "@/components/ui/button";
import { CheckCircle2, SeparatorHorizontal, Gauge } from "lucide-react";

export function HeroSection() {
  const scrollToCalculator = () => {
    const calculator = document.getElementById('calculator');
    if (calculator) {
      calculator.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-12">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">Calculate Your Moving Costs</h2>
            <p className="text-gray-600 mb-8">Get instant estimates for your move and compare options to find the best solution for your budget and needs.</p>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <CheckCircle2 className="text-primary mr-2 h-5 w-5" />
                <span className="text-sm text-gray-700">Accurate Estimates</span>
              </div>
              <div className="flex items-center">
                <SeparatorHorizontal className="text-primary mr-2 h-5 w-5" />
                <span className="text-sm text-gray-700">Multiple Options</span>
              </div>
              <div className="flex items-center">
                <Gauge className="text-primary mr-2 h-5 w-5" />
                <span className="text-sm text-gray-700">Instant Results</span>
              </div>
            </div>
            <Button 
              onClick={scrollToCalculator} 
              className="inline-block bg-primary hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md shadow-sm transition-colors"
            >
              Start Your Estimate
            </Button>
          </div>
          <div className="md:w-1/2 bg-gray-100 relative h-72 md:h-auto overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1600518464441-9306b5986a86?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" 
              alt="Family preparing for move" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
