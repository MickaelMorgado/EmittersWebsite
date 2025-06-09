import { notFound } from 'next/navigation';
import Link from 'next/link';

// This would typically come from a database or API
const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with Next.js',
    content: [
      'Next.js is a React framework that enables server-side rendering and static site generation. It provides a great developer experience with features like fast refresh, file-system based routing, and API routes.',
      'In this post, we\'ll explore the basics of setting up a Next.js project and creating your first pages. We\'ll cover everything from installation to deployment, including how to use the built-in routing system and data fetching methods.',
      'You\'ll learn about the file-system based routing, data fetching methods, and deployment options. We\'ll also discuss some of the key features that make Next.js a great choice for building modern web applications, such as automatic code splitting, optimized performance, and seamless integration with Vercel for deployment.'
    ].join('\n\n'),
    slug: 'getting-started-with-nextjs',
    date: '2023-05-15',
    author: 'Jane Doe',
    readTime: '5 min read',
    category: 'Development',
    image: '/images/nextjs-blog.jpg',
    tags: ['Next.js', 'React', 'JavaScript']
  },
  {
    id: 2,
    title: 'React Hooks Explained',
    content: [
      'React Hooks were introduced in React 16.8 to allow using state and other React features without writing classes. They provide a more direct API to the React concepts you already know: props, state, context, refs, and lifecycle.',
      'In this post, we\'ll cover the most commonly used hooks like useState, useEffect, and useContext. We\'ll explore practical examples of how to use these hooks in real-world applications and discuss common patterns and best practices.',
      'We\'ll also discuss when and how to create your own custom hooks to extract component logic into reusable functions. This can help keep your components clean and focused while sharing stateful logic between components.'
    ].join('\n\n'),
    slug: 'react-hooks-explained',
    date: '2023-05-10',
    author: 'John Smith',
    readTime: '7 min read',
    category: 'React',
    image: '/images/react-hooks.jpg',
    tags: ['React', 'Hooks', 'JavaScript']
  },
  {
    id: 3,
    title: 'Building Responsive UIs',
    content: [
      'Creating responsive designs is crucial in today\'s multi-device world. Users expect websites to work seamlessly across all their devices, from mobile phones to large desktop displays.',
      'In this post, we\'ll explore modern CSS techniques including Flexbox, Grid, and CSS custom properties. We\'ll look at practical examples of how to implement responsive designs that adapt to different screen sizes and devices.',
      'We\'ll also discuss responsive images and performance considerations. You\'ll learn how to optimize your images for different devices and network conditions, and how to use modern image formats like WebP to improve your site\'s performance.'
    ].join('\n\n'),
    slug: 'building-responsive-uis',
    date: '2023-05-05',
    author: 'Alex Johnson',
    readTime: '6 min read',
    category: 'Design',
    image: '/images/responsive-design.jpg',
    tags: ['CSS', 'Responsive Design', 'UI/UX']
  },
  {
    id: 4,
    title: 'State Management in 2023',
    content: [
      'State management is a crucial aspect of building modern web applications. As applications grow in complexity, managing state effectively becomes increasingly important for maintainability and performance.',
      'In this post, we\'ll compare different state management solutions for React applications, including Context API, Redux, Zustand, and Jotai. We\'ll discuss the pros and cons of each approach and when you might choose one over the others.',
      'We\'ll also explore some of the latest trends in state management, including server state management with libraries like React Query and SWR, and how these tools can simplify data fetching and caching in your applications.'
    ].join('\n\n'),
    slug: 'state-management-2023',
    date: '2023-04-28',
    author: 'Sarah Williams',
    readTime: '8 min read',
    category: 'React',
    image: '/images/state-management.jpg',
    tags: ['React', 'State Management', 'Redux']
  },
  {
    id: 5,
    title: 'CSS Grid vs Flexbox',
    content: [
      'CSS Grid and Flexbox are both powerful layout tools in CSS, but they serve different purposes. Understanding when to use each can help you create more efficient and maintainable layouts.',
      'In this post, we\'ll explore the key differences between CSS Grid and Flexbox, including their one-dimensional vs. two-dimensional nature and how they handle alignment and spacing. We\'ll look at practical examples of when to use each layout method.',
      'We\'ll also discuss how these layout methods can work together to create complex, responsive designs. You\'ll learn how to combine Grid and Flexbox to take advantage of the strengths of both layout models in your projects.'
    ].join('\n\n'),
    slug: 'css-grid-vs-flexbox',
    date: '2023-04-20',
    author: 'Michael Chen',
    readTime: '6 min read',
    category: 'CSS',
    image: '/images/css-grid-flexbox.jpg',
    tags: ['CSS', 'Layout', 'Responsive Design']
  },
  {
    id: 6,
    title: 'TypeScript Best Practices',
    content: [
      'TypeScript has become an essential tool for many JavaScript developers, providing static typing and improved tooling for large-scale applications. However, to get the most out of TypeScript, it\'s important to follow best practices.',
      'In this post, we\'ll cover TypeScript best practices for 2023, including type definitions, interfaces vs. types, and how to effectively use generics. We\'ll also discuss how to configure your TypeScript project for optimal type checking and developer experience.',
      'We\'ll explore advanced TypeScript features like conditional types, mapped types, and template literal types, and show how these can help you write more maintainable and type-safe code. You\'ll also learn how to gradually migrate a JavaScript codebase to TypeScript.'
    ].join('\n\n'),
    slug: 'typescript-best-practices',
    date: '2023-04-15',
    author: 'David Kim',
    readTime: '9 min read',
    category: 'TypeScript',
    image: '/images/typescript.jpg',
    tags: ['TypeScript', 'JavaScript', 'Type Safety']
  },
];

interface BlogPostPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = blogPosts.find((post) => post.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <article className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/blog" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Blog
        </Link>
        
        <header className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
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
            <span className="mx-2">•</span>
            <span>{post.readTime}</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium mr-3">
              {post.author.split(' ').map(name => name[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{post.author}</p>
              <p className="text-xs text-gray-500">Author</p>
            </div>
          </div>
        </header>
        
        <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-8">
          {/* This would be an actual image in a real app */}
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Featured Image: {post.image}</span>
          </div>
        </div>
        
        <div className="prose max-w-none">
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-6 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">About the author</h3>
          <div className="flex items-start">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-xl mr-4 flex-shrink-0">
              {post.author.split(' ').map(name => name[0]).join('')}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">{post.author}</h4>
              <p className="text-gray-600 mt-1">
                {post.author} is a {post.category} expert with years of experience in the industry. 
                They love sharing their knowledge and helping others learn and grow in their careers.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Related articles</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts
              .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(tag => post.tags.includes(tag))))
              .slice(0, 2)
              .map((relatedPost) => (
                <Link 
                  key={relatedPost.id} 
                  href={`/blog/${relatedPost.slug}`}
                  className="group block p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {relatedPost.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {relatedPost.date} • {relatedPost.readTime}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </article>
    </main>
  );
}
