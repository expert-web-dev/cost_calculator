interface StepperProgressProps {
  currentStep: number;
}

export function StepperProgress({ currentStep }: StepperProgressProps) {
  const steps = [
    { number: 1, label: "Locations" },
    { number: 2, label: "Home Size" },
    { number: 3, label: "Move Date" },
    { number: 4, label: "Results" },
  ];

  return (
    <div className="px-6 pt-6">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center relative">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${step.number <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              {step.number}
            </div>
            <div 
              className={`text-sm font-medium mt-2 
                ${step.number <= currentStep ? 'text-gray-900' : 'text-gray-600'}`}
            >
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`absolute h-1 right-1/2 top-5 w-full
                  ${step.number < currentStep ? 'bg-primary' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
