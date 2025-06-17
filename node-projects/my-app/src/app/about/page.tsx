export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <div className="max-w-3xl space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Story</h2>
          <p className="text-gray-700 leading-relaxed">
            Founded in 2023, we started as a small team of passionate developers with a vision to create exceptional digital experiences. 
            Over the years, we've grown into a full-service development agency, helping businesses of all sizes bring their ideas to life.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed">
            Our mission is to build innovative, user-friendly, and scalable web applications that solve real-world problems. 
            We believe in clean code, thoughtful design, and creating meaningful connections between businesses and their customers.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-3">Our Team</h2>
          <p className="text-gray-700 leading-relaxed">
            We're a diverse team of designers, developers, and problem-solvers who are passionate about technology and its potential 
            to transform businesses. Each member brings unique skills and perspectives, but we all share a commitment to excellence 
            and continuous learning.
          </p>
        </section>
        
        <section className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-3 text-blue-800">Why Choose Us?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Proven track record of successful projects</li>
            <li>Focus on clean, maintainable code</li>
            <li>User-centered design approach</li>
            <li>Transparent communication</li>
            <li>Ongoing support and maintenance</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
