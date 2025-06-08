import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with Next.js',
    excerpt: 'Learn the basics of Next.js and how to build modern web applications with this powerful React framework.',
    slug: 'getting-started-with-nextjs',
    date: '2023-05-15',
    readTime: '5 min read',
    category: 'Development'
  },
  {
    id: 2,
    title: 'React Hooks Explained',
    excerpt: 'A comprehensive guide to understanding and using React Hooks effectively in your applications.',
    slug: 'react-hooks-explained',
    date: '2023-05-10',
    readTime: '7 min read',
    category: 'React'
  },
  {
    id: 3,
    title: 'Building Responsive UIs',
    excerpt: 'Learn modern techniques for creating responsive user interfaces that work across all devices.',
    slug: 'building-responsive-uis',
    date: '2023-05-05',
    readTime: '6 min read',
    category: 'Design'
  },
  {
    id: 4,
    title: 'State Management in 2023',
    excerpt: 'Comparing different state management solutions for modern React applications.',
    slug: 'state-management-2023',
    date: '2023-04-28',
    readTime: '8 min read',
    category: 'React'
  },
  {
    id: 5,
    title: 'CSS Grid vs Flexbox',
    excerpt: 'When to use CSS Grid and when to stick with Flexbox for your layouts.',
    slug: 'css-grid-vs-flexbox',
    date: '2023-04-20',
    readTime: '6 min read',
    category: 'CSS'
  },
  {
    id: 6,
    title: 'TypeScript Best Practices',
    excerpt: 'Learn the best practices for using TypeScript in your projects to catch errors early.',
    slug: 'typescript-best-practices',
    date: '2023-04-15',
    readTime: '9 min read',
    category: 'TypeScript'
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-xl text-gray-600">Thoughts, stories, and insights from our team</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <article key={post.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {post.category}
                </span>
                <span className="mx-2">•</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>
              <h2 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{post.readTime}</span>
                <Link 
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  Read more →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      <div className="mt-12 flex justify-center">
        <nav className="inline-flex rounded-md shadow">
          <a
            href="#"
            className="px-4 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-l-md"
          >
            Previous
          </a>
          <a
            href="#"
            className="px-4 py-2 border-t border-b border-r border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
          >
            1
          </a>
          <a
            href="#"
            className="px-4 py-2 border-t border-b border-r border-gray-300 bg-blue-50 text-blue-600 font-medium"
          >
            2
          </a>
          <a
            href="#"
            className="px-4 py-2 border-t border-b border-r border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
          >
            3
          </a>
          <a
            href="#"
            className="px-4 py-2 border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 rounded-r-md"
          >
            Next
          </a>
        </nav>
      </div>
    </main>
  );
}
