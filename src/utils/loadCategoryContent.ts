// src/utils/loadCategoryContent.ts

// Allowed category slugs - prevents path traversal attacks
const ALLOWED_CATEGORIES = ['geld', 'wohnen', 'energie', 'auto', 'familie', 'gesundheit', 'versicherungen'];

export interface CategoryContent {
  title: string;
  slug: string;
  content: string;
  sections: {
    intro: string;
    mistakes: string;
    changes2026: string;
    bestPractices: string;
    faq: string;
  };
}

export async function loadCategoryContent(slug: string): Promise<CategoryContent | null> {
  try {
    // Validate slug against whitelist to prevent path traversal
    if (!ALLOWED_CATEGORIES.includes(slug)) {
      console.error(`Invalid category slug: ${slug}`);
      return null;
    }

    // Import the markdown file dynamically
    const module = await import(`../content/categories/${slug}.md`);
    const { frontmatter, default: content } = module;

    // Validate frontmatter structure before accessing properties
    if (!frontmatter || typeof frontmatter.title !== 'string' || typeof frontmatter.slug !== 'string') {
      console.error(`Invalid frontmatter in ${slug}.md: missing or malformed title/slug`);
      return null;
    }

    // Parse sections from markdown content
    const sections = {
      intro: extractSection(content, 'Das Wichtigste zuerst'),
      mistakes: extractSection(content, 'Häufige Fehler'),
      changes2026: extractSection(content, 'Was sich 2026 ändert'),
      bestPractices: extractSection(content, 'Best Practices'),
      faq: extractSection(content, 'FAQ')
    };

    return {
      title: frontmatter.title,
      slug: frontmatter.slug,
      content,
      sections
    };
  } catch (error) {
    console.error(`Failed to load category content for ${slug}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

function extractSection(content: string, sectionTitle: string): string {
  // Escape special regex characters in sectionTitle to prevent injection
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // More robust regex: match heading with flexible whitespace, multiline mode
  const regex = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##|$)`, 'm');
  const match = content.match(regex);
  return match && match[1] ? match[1].trim() : '';
}
