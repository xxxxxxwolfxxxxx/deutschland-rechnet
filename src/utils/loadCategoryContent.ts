// src/utils/loadCategoryContent.ts
import fs from 'fs';
import path from 'path';

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

    // Construct absolute path to the markdown file
    // Walk up from wherever we are to find the project root, then go into src
    let projectRoot = process.cwd();

    // Make sure we're at the project root (one with package.json)
    while (!fs.existsSync(path.join(projectRoot, 'package.json')) && projectRoot !== '/') {
      projectRoot = path.dirname(projectRoot);
    }

    const filePath = path.join(projectRoot, 'src', 'content', 'categories', `${slug}.md`);

    // Read the raw markdown file
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse the markdown file with frontmatter manually
    const { frontmatter, content } = parseFrontmatter(fileContent);

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

function parseFrontmatter(fileContent: string): { frontmatter: Record<string, unknown>; content: string } {
  // Match YAML frontmatter block at the beginning of the file
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, content: fileContent };
  }

  const yamlContent = match[1];
  const content = match[2];

  // Simple YAML parser for our use case (only strings and simple values)
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, content };
}

function extractSection(content: string, sectionTitle: string): string {
  // Escape special regex characters in sectionTitle to prevent injection
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // More robust regex: match heading with flexible whitespace, multiline mode
  const regex = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##|$)`, 'm');
  const match = content.match(regex);
  return match && match[1] ? match[1].trim() : '';
}
