export function Testimonials() {
  const testimonials = [
    {
      name: "Jennifer D.",
      location: "Los Angeles, CA",
      rating: 5,
      text: "The cost calculator was so accurate! I was expecting a much higher quote from movers but MoveEase helped me find an affordable option that worked perfectly for my budget."
    },
    {
      name: "Michael T.",
      location: "Chicago, IL",
      rating: 5,
      text: "I appreciated being able to compare different moving options side by side. It made the decision much easier and I ended up saving almost $300 by going with the hybrid option."
    },
    {
      name: "Sarah L.",
      location: "Austin, TX",
      rating: 4.5,
      text: "The step-by-step process was so simple to follow. I was dreading figuring out my moving costs but this tool made it painless. Highly recommend to anyone planning a move!"
    }
  ];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">What Our Customers Say</h2>
      
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, i) => (
          <div key={i} className="bg-white border rounded-lg p-6">
            <div className="flex text-amber-400 mb-4">
              {[...Array(5)].map((_, index) => (
                <svg 
                  key={index} 
                  className="h-5 w-5" 
                  fill={index < Math.floor(testimonial.rating) ? "currentColor" : (index < testimonial.rating ? "currentColor" : "none")} 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              ))}
            </div>
            <blockquote className="text-gray-700 mb-4">
              "{testimonial.text}"
            </blockquote>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm">{testimonial.name}</p>
                <p className="text-xs text-gray-500">{testimonial.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
