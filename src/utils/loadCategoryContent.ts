// src/utils/loadCategoryContent.ts

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
    // Import the markdown file dynamically
    const module = await import(`../content/categories/${slug}.md`);
    const { frontmatter, default: content } = module;

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
    console.error(`Failed to load category content for ${slug}:`, error);
    return null;
  }
}

function extractSection(content: string, sectionTitle: string): string {
  const regex = new RegExp(`##\\s+${sectionTitle}\\s+(.*?)(?=##|$)`, 's');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}
