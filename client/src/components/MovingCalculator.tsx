import { StepperProgress } from "./StepperProgress";
import { CalculatorForm } from "./CalculatorForm";
import { useState } from "react";
import { MoveCalculationResponse } from "@shared/schema";

export function MovingCalculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<MoveCalculationResponse | null>(null);

  return (
    <section id="calculator" className="mb-16">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Moving Cost Calculator</h2>
          <p className="text-gray-600 mt-1">Fill out the details below to get your estimate</p>
        </div>
        
        <StepperProgress currentStep={currentStep} />
        
        <CalculatorForm 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep}
          setResults={setResults}
          results={results}
        />
      </div>
    </section>
  );
}
