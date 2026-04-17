// Blog.tsx
import { Link } from "react-router-dom";
import { Calendar, User, Tag, ArrowRight } from "lucide-react";

// Sample blog post data – replace with your actual data source
const blogPosts = [
  {
    id: 1,
    title: "Deep Learning Breakthroughs in Medical Imaging",
    excerpt:
      "Recent advances in convolutional neural networks are enabling faster and more accurate diagnosis from MRI and CT scans.",
    // image: "/images/blog/medical-imaging.jpg", // replace with actual path
    image: "https://picsum.photos/id/1043/400/200",
    date: "March 15, 2026",
    author: "Dr. Sarah Chen",
    category: "AI & Healthcare",
    slug: "/blog/deep-learning-medical-imaging",
  },
  {
    id: 2,
    title: "Open Access Publishing: What Researchers Need to Know",
    excerpt:
      "A comprehensive guide to open access options, article processing charges, and maximizing the impact of your research.",
    image: "https://picsum.photos/id/24/400/200",
    date: "March 10, 2026",
    author: "Prof. Michael Okafor",
    category: "Publishing",
    slug: "/blog/open-access-guide",
  },
  {
    id: 3,
    title: "5G and Beyond: The Future of Wireless Communication",
    excerpt:
      "Exploring the potential of 6G networks, terahertz frequencies, and AI-driven network optimization.",
    image: "https://picsum.photos/id/20/400/200",
    date: "March 5, 2026",
    author: "Dr. Elena Voss",
    category: "Communications",
    slug: "/blog/5g-and-beyond",
  },
  {
    id: 4,
    title: "Ethics in Artificial Intelligence: A Framework for Researchers",
    excerpt:
      "As AI systems become more powerful, understanding bias, fairness, and transparency is essential for responsible innovation.",
    image: "https://picsum.photos/id/84/400/200",
    date: "February 28, 2026",
    author: "Prof. James Okonkwo",
    category: "Ethics",
    slug: "/blog/ai-ethics-framework",
  },
  {
    id: 5,
    title: "Quantum Computing: From Theory to Practical Hardware",
    excerpt:
      "An update on the latest quantum processors, error correction techniques, and near-term applications.",
    image: "https://picsum.photos/id/119/400/200",
    date: "February 20, 2026",
    author: "Dr. Anita Desai",
    category: "Quantum",
    slug: "/blog/quantum-hardware",
  },
  {
    id: 6,
    title: "How to Write a Compelling Research Paper Abstract",
    excerpt:
      "Tips and examples to help you craft an abstract that gets your paper noticed and cited.",
    image: "https://picsum.photos/id/26/400/200",
    date: "February 14, 2026",
    author: "Dr. Robert Liu",
    category: "Writing",
    slug: "/blog/abstract-writing",
  },
];

interface BlogProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  posts?: typeof blogPosts;
}

export function Blog({
  title = "Latest from Our Blog",
  subtitle = "Insights, news, and tips for researchers and technology professionals",
  showViewAll = true,
  viewAllLink = "/blog",
  posts = blogPosts,
}: BlogProps) {
  return (
    <section className="container py-16 md:py-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>
        </div>
        {showViewAll && (
          <Link
            to={viewAllLink}
            className="group inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            View all posts
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Blog grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={post.slug}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-md transition-all hover:shadow-xl"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-muted">
              <img
                src={post.image}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Category */}
              {post.category && (
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  {post.category}
                </p>
              )}
              {/* Title */}
              <h3 className="font-heading font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              {/* Excerpt */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.author}
                </span>
              </div>
            </div>

            {/* Optional subtle arrow on hover */}
            <div className="px-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center text-sm font-medium text-primary">
                Read more <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}