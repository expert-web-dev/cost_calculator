export function ImageGallery() {
  const resources = [
    {
      image: "https://images.unsplash.com/photo-1595835018349-198460e1d309?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      title: "Packing Efficiently",
      description: "Learn how to pack your belongings for maximum protection and space efficiency.",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1603796846097-bee99e4a601f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      title: "Choosing the Right Truck Size",
      description: "Find out what truck size is right for your move to avoid multiple trips.",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      title: "Apartment Moving Tips",
      description: "Special considerations for moving in and out of apartment buildings.",
      link: "#"
    },
    {
      image: "https://images.unsplash.com/photo-1590725140246-20acddc1ec6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
      title: "Moving Day Checklist",
      description: "Everything you need to do before, during, and after your move.",
      link: "#"
    }
  ];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-semibold text-gray-900 mb-8">Moving Tips & Resources</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources.map((resource, index) => (
          <div key={index} className="group">
            <div className="relative overflow-hidden rounded-lg h-48">
              <img 
                src={resource.image} 
                alt={resource.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
              <h3 className="absolute bottom-4 left-4 right-4 text-white font-medium">{resource.title}</h3>
            </div>
            <p className="text-gray-600 text-sm mt-2">{resource.description}</p>
            <a href={resource.link} className="text-primary text-sm font-medium inline-block mt-2 hover:text-indigo-700">Read more</a>
          </div>
        ))}
      </div>
    </section>
  );
}
