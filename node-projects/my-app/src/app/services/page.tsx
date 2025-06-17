import { FaLaptopCode, FaMobileAlt, FaServer, FaChartLine, FaCode, FaPalette } from 'react-icons/fa';

const services = [
  {
    title: 'Web Development',
    description: 'Custom web applications built with modern technologies like Next.js, React, and TypeScript. We create fast, responsive, and user-friendly websites that help your business grow.',
    icon: <FaLaptopCode className="w-8 h-8" />,
    features: [
      'Custom web applications',
      'E-commerce solutions',
      'Progressive Web Apps (PWA)',
      'API integration',
      'Performance optimization'
    ]
  },
  {
    title: 'Mobile Development',
    description: 'Cross-platform mobile applications using React Native for both iOS and Android platforms. We build high-quality mobile apps that provide excellent user experiences.',
    icon: <FaMobileAlt className="w-8 h-8" />,
    features: [
      'iOS & Android apps',
      'Cross-platform development',
      'App store deployment',
      'Push notifications',
      'Offline functionality'
    ]
  },
  {
    title: 'Backend Development',
    description: 'Scalable backend solutions with Node.js, Express, and various database technologies. We build robust APIs and server-side applications that power your digital products.',
    icon: <FaServer className="w-8 h-8" />,
    features: [
      'RESTful APIs',
      'Database design',
      'Authentication & authorization',
      'Serverless architecture',
      'Cloud deployment'
    ]
  },
  {
    title: 'UI/UX Design',
    description: 'Beautiful and intuitive user interfaces designed with your users in mind. We create engaging digital experiences that drive conversions and user satisfaction.',
    icon: <FaPalette className="w-8 h-8" />,
    features: [
      'User research',
      'Wireframing & prototyping',
      'UI/UX design',
      'Design systems',
      'User testing'
    ]
  },
  {
    title: 'Performance Optimization',
    description: 'Improving application performance, load times, and overall user experience. We help you identify and fix performance bottlenecks in your applications.',
    icon: <FaChartLine className="w-8 h-8" />,
    features: [
      'Performance audits',
      'Code optimization',
      'Asset optimization',
      'Caching strategies',
      'Lazy loading'
    ]
  },
  {
    title: 'Custom Software',
    description: 'Tailored software solutions designed specifically for your business needs. We create custom applications that streamline your operations and improve efficiency.',
    icon: <FaCode className="w-8 h-8" />,
    features: [
      'Business process automation',
      'Custom CRM/ERP solutions',
      'Workflow management',
      'Data visualization',
      'Integration services'
    ]
  }
];

const processSteps = [
  {
    number: '01',
    title: 'Discovery',
    description: 'We start by understanding your business goals, target audience, and project requirements.'
  },
  {
    number: '02',
    title: 'Planning',
    description: 'We create a detailed project plan with milestones, deliverables, and timelines.'
  },
  {
    number: '03',
    title: 'Design',
    description: 'Our designers create wireframes and high-fidelity mockups for your review and feedback.'
  },
  {
    number: '04',
    title: 'Development',
    description: 'Our developers bring the designs to life with clean, efficient, and maintainable code.'
  },
  {
    number: '05',
    title: 'Testing',
    description: 'We thoroughly test the application to ensure it works flawlessly across all devices and browsers.'
  },
  {
    number: '06',
    title: 'Launch & Support',
    description: 'We deploy your project and provide ongoing support and maintenance as needed.'
  }
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              We deliver innovative digital solutions that drive business growth and success.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive digital solutions tailored to your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <h4 className="font-medium text-gray-900 mb-3">Key Features:</h4>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    Learn more →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A clear, structured approach to delivering exceptional results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start your project?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Let's discuss how we can help you achieve your business goals with our expert services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/contact"
              className="px-8 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100 transition-colors"
            >
              Get in Touch
            </a>
            <a
              href="/about"
              className="px-8 py-3 border-2 border-white text-white font-medium rounded-md hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Learn More About Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
