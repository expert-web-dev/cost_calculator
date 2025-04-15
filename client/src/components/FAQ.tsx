import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How accurate are the cost estimates?",
      answer: "Our cost estimates are based on industry averages and real data from moving companies in your area. While they provide a good guideline, final costs may vary based on specific requirements, additional services, or seasonal pricing changes. We recommend getting a detailed quote from moving companies for the most accurate pricing."
    },
    {
      question: "What factors affect moving costs the most?",
      answer: "The main factors that affect moving costs are: distance between locations, home size/volume of belongings, timing (peak vs. off-peak season), special items requiring extra care, accessibility at both locations, and additional services like packing or storage."
    },
    {
      question: "When should I start planning my move?",
      answer: "It's best to start planning your move at least 8 weeks in advance. This gives you plenty of time to research moving companies, get quotes, organize packing supplies, and handle other logistics like address changes and utility transfers."
    },
    {
      question: "Is it cheaper to move during certain times of the year?",
      answer: "Yes, moving during the off-peak season (October through April) is typically cheaper than moving during the summer months. Additionally, weekdays are usually less expensive than weekends, and mid-month moves can be more affordable than beginning or end of month moves when demand is higher."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Frequently Asked Questions</h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <button 
              className="flex justify-between items-center w-full p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              onClick={() => toggleFaq(index)}
            >
              <span className="font-medium">{faq.question}</span>
              <span className="transform transition-transform">
                {openIndex === index ? <ChevronUp /> : <ChevronDown />}
              </span>
            </button>
            <div className={`p-4 bg-gray-50 border-t ${openIndex === index ? 'block' : 'hidden'}`}>
              <p className="text-gray-700">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
